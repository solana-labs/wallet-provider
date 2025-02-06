import {
    createDefaultAddressSelector,
    createDefaultAuthorizationResultCache,
    createDefaultWalletNotFoundHandler,
    SolanaMobileWalletAdapter,
    SolanaMobileWalletAdapterWalletName,
} from '@solana-mobile/wallet-adapter-mobile';
import { type Adapter, type WalletError, type WalletName } from '@solana/wallet-adapter-base';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import getEnvironment, { Environment } from './getEnvironment.js';
import getInferredClusterFromEndpoint from './getInferredClusterFromEndpoint.js';
import { useConnection } from './useConnection.js';
import { useLocalStorage } from './useLocalStorage.js';
import { WalletProviderBase } from './WalletProviderBase.js';

export interface WalletProviderProps {
    children: ReactNode;
    wallets: Adapter[];
    autoConnect?: boolean | ((adapter: Adapter) => Promise<boolean>);
    localStorageKey?: string;
    onError?: (error: WalletError, adapter?: Adapter) => void;
}

let _userAgent: string | null;
function getUserAgent() {
    if (_userAgent === undefined) {
        _userAgent = globalThis.navigator?.userAgent ?? null;
    }
    return _userAgent;
}

function getIsMobile(adapters: Adapter[]) {
    const userAgentString = getUserAgent();
    return getEnvironment({ adapters, userAgentString }) === Environment.MOBILE_WEB;
}

function getUriForAppIdentity() {
    const location = globalThis.location;
    if (!location) return;
    return `${location.protocol}//${location.host}`;
}

export function WalletProvider({
    children,
    wallets: adapters,
    autoConnect,
    localStorageKey = 'walletName',
    onError,
}: WalletProviderProps) {
    const { connection } = useConnection();
    const adaptersWithStandardAdapters = useStandardWalletAdapters(adapters);
    const mobileWalletAdapter = useMemo(() => {
        if (!getIsMobile(adaptersWithStandardAdapters)) {
            return null;
        }
        const existingMobileWalletAdapter = adaptersWithStandardAdapters.find(
            (adapter) => adapter.name === SolanaMobileWalletAdapterWalletName
        );
        if (existingMobileWalletAdapter) {
            return existingMobileWalletAdapter;
        }
        return new SolanaMobileWalletAdapter({
            addressSelector: createDefaultAddressSelector(),
            appIdentity: {
                uri: getUriForAppIdentity(),
            },
            authorizationResultCache: createDefaultAuthorizationResultCache(),
            cluster: getInferredClusterFromEndpoint(connection?.rpcEndpoint),
            onWalletNotFound: createDefaultWalletNotFoundHandler(),
        });
    }, [adaptersWithStandardAdapters, connection?.rpcEndpoint]);
    const adaptersWithMobileWalletAdapter = useMemo(() => {
        if (mobileWalletAdapter == null || adaptersWithStandardAdapters.indexOf(mobileWalletAdapter) !== -1) {
            return adaptersWithStandardAdapters;
        }
        return [mobileWalletAdapter, ...adaptersWithStandardAdapters];
    }, [adaptersWithStandardAdapters, mobileWalletAdapter]);
    const [walletName, setWalletName] = useLocalStorage<WalletName | null>(localStorageKey, null);
    const adapter = useMemo(
        () => adaptersWithMobileWalletAdapter.find((a) => a.name === walletName) ?? null,
        [adaptersWithMobileWalletAdapter, walletName]
    );
    const changeWallet = useCallback(
        (nextWalletName: WalletName<string> | null) => {
            if (walletName === nextWalletName) return;
            if (
                adapter &&
                // Selecting a wallet other than the mobile wallet adapter is not
                // sufficient reason to call `disconnect` on the mobile wallet adapter.
                // Calling `disconnect` on the mobile wallet adapter causes the entire
                // authorization store to be wiped.
                adapter.name !== SolanaMobileWalletAdapterWalletName
            ) {
                adapter.disconnect();
            }
            setWalletName(nextWalletName);
        },
        [adapter, setWalletName, walletName]
    );
    useEffect(() => {
        if (!adapter) return;
        function handleDisconnect() {
            if (isUnloadingRef.current) return;
            setWalletName(null);
        }
        adapter.on('disconnect', handleDisconnect);
        return () => {
            adapter.off('disconnect', handleDisconnect);
        };
    }, [adapter, adaptersWithStandardAdapters, setWalletName, walletName]);
    const hasUserSelectedAWallet = useRef(false);
    const handleAutoConnectRequest = useMemo(() => {
        if (!autoConnect || !adapter) return;
        return async () => {
            // If autoConnect is true or returns true, use the default autoConnect behavior.
            if (autoConnect === true || (await autoConnect(adapter))) {
                if (hasUserSelectedAWallet.current) {
                    await adapter.connect();
                } else {
                    await adapter.autoConnect();
                }
            }
        };
    }, [autoConnect, adapter]);
    const isUnloadingRef = useRef(false);
    useEffect(() => {
        if (walletName === SolanaMobileWalletAdapterWalletName && getIsMobile(adaptersWithStandardAdapters)) {
            isUnloadingRef.current = false;
            return;
        }
        function handleBeforeUnload() {
            isUnloadingRef.current = true;
        }
        /**
         * Some wallets fire disconnection events when the window unloads. Since there's no way to
         * distinguish between a disconnection event received because a user initiated it, and one
         * that was received because they've closed the window, we have to track window unload
         * events themselves. Downstream components use this information to decide whether to act
         * upon or drop wallet events and errors.
         */
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [adaptersWithStandardAdapters, walletName]);
    const handleConnectError = useCallback(() => {
        if (adapter) {
            // If any error happens while connecting, unset the adapter.
            changeWallet(null);
        }
    }, [adapter, changeWallet]);
    const selectWallet = useCallback(
        (walletName: WalletName | null) => {
            hasUserSelectedAWallet.current = true;
            changeWallet(walletName);
        },
        [changeWallet]
    );
    return (
        <WalletProviderBase
            wallets={adaptersWithMobileWalletAdapter}
            adapter={adapter}
            isUnloadingRef={isUnloadingRef}
            onAutoConnectRequest={handleAutoConnectRequest}
            onConnectError={handleConnectError}
            onError={onError}
            onSelectWallet={selectWallet}
        >
            {children}
        </WalletProviderBase>
    );
}
