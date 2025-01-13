import type { default as Transport } from '@ledgerhq/hw-transport';
import { StatusCodes, TransportStatusError } from '@ledgerhq/hw-transport';
import { isVersionedTransaction } from '@solana/wallet-adapter-base';
import type { Transaction, VersionedTransaction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import './polyfills/index.js';

export function getDerivationPath(account?: number, change?: number): Buffer {
    const length = account !== undefined ? (change === undefined ? 3 : 4) : 2;
    const derivationPath = Buffer.alloc(1 + length * 4);

    let offset = derivationPath.writeUInt8(length, 0);
    offset = derivationPath.writeUInt32BE(harden(44), offset); // Using BIP44
    offset = derivationPath.writeUInt32BE(harden(501), offset); // Solana's BIP44 path

    if (account !== undefined) {
        offset = derivationPath.writeUInt32BE(harden(account), offset);
        if (change !== undefined) {
            derivationPath.writeUInt32BE(harden(change), offset);
        }
    }

    return derivationPath;
}

const BIP32_HARDENED_BIT = (1 << 31) >>> 0;

function harden(n: number): number {
    return (n | BIP32_HARDENED_BIT) >>> 0;
}

const INS_GET_PUBKEY = 0x05;
const INS_SIGN_MESSAGE = 0x06;
const INS_SIGN_MESSAGE_OFFCHAIN = 0x07;

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

const P2_EXTEND = 0x01;
const P2_MORE = 0x02;

const MAX_PAYLOAD = 255;

const LEDGER_CLA = 0xe0;

// Max off-chain message length supported by Ledger
const OFFCM_MAX_LEDGER_LEN = 1212;
// Max length of version 0 off-chain message
const OFFCM_MAX_V0_LEN = 65515;

export class OffchainMessage {
    version: number;
    messageFormat: number | undefined;
    message: Buffer | undefined;

    /**
     * Constructs a new OffchainMessage
     * @param {version: number, messageFormat: number, message: string | Buffer} opts - Constructor parameters
     */
    constructor(opts: { version?: number; messageFormat?: number; message: Buffer }) {
        this.version = 0;
        this.messageFormat = undefined;
        this.message = undefined;

        if (!opts) {
            return;
        }
        if (opts.version) {
            this.version = opts.version;
        }
        if (opts.messageFormat) {
            this.messageFormat = opts.messageFormat;
        }
        if (opts.message) {
            this.message = Buffer.from(opts.message);
            if (this.version === 0) {
                if (!this.messageFormat) {
                    this.messageFormat = OffchainMessage.guessMessageFormat(this.message);
                }
            }
        }
    }

    static guessMessageFormat(message: Buffer) {
        if (Object.prototype.toString.call(message) !== '[object Uint8Array]') {
            return undefined;
        }
        if (message.length <= OFFCM_MAX_LEDGER_LEN) {
            if (OffchainMessage.isPrintableASCII(message)) {
                return 0;
            } else if (OffchainMessage.isUTF8(message)) {
                return 1;
            }
        } else if (message.length <= OFFCM_MAX_V0_LEN) {
            if (OffchainMessage.isUTF8(message)) {
                return 2;
            }
        }
        return undefined;
    }

    static isPrintableASCII(buffer: Buffer) {
        return (
            buffer &&
            buffer.every((element) => {
                return element >= 0x20 && element <= 0x7e;
            })
        );
    }

    static isUTF8(buffer: Buffer) {
        return buffer && isValidUTF8(buffer);
    }

    isValid() {
        if (this.version !== 0) {
            return false;
        }
        if (!this.message) {
            return false;
        }
        const format = OffchainMessage.guessMessageFormat(this.message);
        return format != null && format === this.messageFormat;
    }

    isLedgerSupported(allowBlindSigning: boolean) {
        return this.isValid() && (this.messageFormat === 0 || (this.messageFormat === 1 && allowBlindSigning));
    }

    serialize() {
        if (!this.isValid()) {
            throw new Error(`Invalid OffchainMessage: ${JSON.stringify(this)}`);
        }
        const buffer = Buffer.alloc(4);
        let offset = buffer.writeUInt8(this.version);
        offset = buffer.writeUInt8(this.messageFormat!, offset);
        offset = buffer.writeUInt16LE(this.message!.length, offset);
        return Buffer.concat([Buffer.from([255]), Buffer.from('solana offchain'), buffer, this.message!]);
    }
}

/** @internal */
export async function getPublicKey(transport: Transport, derivationPath: Buffer): Promise<PublicKey> {
    const bytes = await send(transport, INS_GET_PUBKEY, P1_NON_CONFIRM, derivationPath);
    return new PublicKey(bytes);
}

/** @internal */
export async function signTransaction(
    transport: Transport,
    transaction: Transaction | VersionedTransaction,
    derivationPath: Buffer
): Promise<Buffer> {
    const paths = Buffer.alloc(1);
    paths.writeUInt8(1, 0);

    const message = isVersionedTransaction(transaction)
        ? transaction.message.serialize()
        : transaction.serializeMessage();
    const data = Buffer.concat([paths, derivationPath, message]);

    return await send(transport, INS_SIGN_MESSAGE, P1_CONFIRM, data);
}

/** @internal */
export async function signMessage(transport: Transport, message: Buffer, derivationPath: Buffer): Promise<Buffer> {
    const paths = Buffer.alloc(1);
    paths.writeUInt8(1, 0);

    const data = Buffer.concat([paths, derivationPath, message]);

    return await send(transport, INS_SIGN_MESSAGE_OFFCHAIN, P1_CONFIRM, data);
}

async function send(transport: Transport, instruction: number, p1: number, data: Buffer): Promise<Buffer> {
    let p2 = 0;
    let offset = 0;

    if (data.length > MAX_PAYLOAD) {
        while (data.length - offset > MAX_PAYLOAD) {
            const buffer = data.slice(offset, offset + MAX_PAYLOAD);
            const response = await transport.send(LEDGER_CLA, instruction, p1, p2 | P2_MORE, buffer);
            // @ts-ignore -- TransportStatusError is a constructor Function, not a Class
            if (response.length !== 2) throw new TransportStatusError(StatusCodes.INCORRECT_DATA);

            p2 |= P2_EXTEND;
            offset += MAX_PAYLOAD;
        }
    }

    const buffer = data.slice(offset);
    const response = await transport.send(LEDGER_CLA, instruction, p1, p2, buffer);

    return response.slice(0, response.length - 2);
}

function isValidUTF8(data: Uint8Array): boolean {
    const length = data.length;
    let i = 0;

    while (i < length) {
        if (data[i] < 0x80) {
            /* 0xxxxxxx */
            ++i;
        } else if ((data[i] & 0xe0) === 0xc0) {
            /* 110XXXXx 10xxxxxx */
            if (i + 1 >= length || (data[i + 1] & 0xc0) != 0x80 || (data[i] & 0xfe) === 0xc0) {
                /* overlong? */ return false;
            } else {
                i += 2;
            }
        } else if ((data[i] & 0xf0) === 0xe0) {
            /* 1110XXXX 10Xxxxxx 10xxxxxx */
            if (
                i + 2 >= length ||
                (data[i + 1] & 0xc0) !== 0x80 ||
                (data[i + 2] & 0xc0) !== 0x80 ||
                (data[i] === 0xe0 && (data[i + 1] & 0xe0) === 0x80) /* overlong? */ ||
                (data[i] === 0xed && (data[i + 1] & 0xe0) === 0xa0) /* surrogate? */ ||
                (data[i] === 0xef && data[i + 1] === 0xbf && (data[i + 2] & 0xfe) === 0xbe)
            ) {
                /* U+FFFE or U+FFFF? */ return false;
            } else {
                i += 3;
            }
        } else if ((data[i] & 0xf8) === 0xf0) {
            /* 11110XXX 10XXxxxx 10xxxxxx 10xxxxxx */
            if (
                i + 3 >= length ||
                (data[i + 1] & 0xc0) !== 0x80 ||
                (data[i + 2] & 0xc0) !== 0x80 ||
                (data[i + 3] & 0xc0) !== 0x80 ||
                (data[i] === 0xf0 && (data[i + 1] & 0xf0) === 0x80) /* overlong? */ ||
                (data[i] === 0xf4 && data[i + 1] > 0x8f) ||
                data[i] > 0xf4
            ) {
                /* > U+10FFFF? */ return false;
            } else {
                i += 4;
            }
        } else {
            return false;
        }
    }
    return true;
}
