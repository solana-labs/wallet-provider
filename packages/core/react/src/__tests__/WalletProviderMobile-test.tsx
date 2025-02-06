/**
 * @jest-environment jsdom
 */

'use strict';

import {
    type AddressSelector,
    type AuthorizationResultCache,
    SolanaMobileWalletAdapter,
    SolanaMobileWalletAdapterWalletName,
} from '@solana-mobile/wallet-adapter-mobile';
import {
    type Adapter,
    WalletError,
    type WalletName,
    WalletReadyState,
} from '@solana/wallet-adapter-base';
import { type Connection, PublicKey } from '@solana/web3.js';
import 'jest-localstorage-mock';
import React, { createRef, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useConnection } from '../useConnection.js';
import { useWallet, type WalletContextState } from '../useWallet.js';
import { WalletProvider, type WalletProviderProps } from '../WalletProvider.js';
import { MockWalletAdapter } from '../__mocks__/MockWalletAdapter.js';

jest.mock('../getEnvironment.js', () => ({
    ...jest.requireActual('../getEnvironment.js'),
    __esModule: true,
    default: () => jest.requireActual('../getEnvironment.js').Environment.MOBILE_WEB,
}));
jest.mock('../getInferredClusterFromEndpoint.js', () => ({
    ...jest.requireActual('../getInferredClusterFromEndpoint.js'),
    __esModule: true,
    default: (endpoint?: string) => {
        switch (endpoint) {
            case 'https://fake-endpoint-for-test.com':
                return 'fake-cluster-for-test';
            default:
                return 'mainnet-beta';
        }
    },
}));
jest.mock('../useConnection.js');

type TestRefType = {
    getWalletContextState(): WalletContextState;
};

const TestComponent = forwardRef(function TestComponentImpl(_props, ref) {
    const wallet = useWallet();
    useImperativeHandle(
        ref,
        () => ({
            getWalletContextState() {
                return wallet;
            },
        }),
        [wallet]
    );
    return null;
});

const WALLET_NAME_CACHE_KEY = 'cachedWallet';

/**
 * NOTE: If you add a test to this suite, also add it to `WalletProviderDesktop-test.tsx`.
 *
 * You may be wondering why these suites haven't been designed as one suite with a procedurally
 * generated `describe` block that mocks `getEnvironment` differently on each pass. The reason has
 * to do with the way `jest.resetModules()` plays havoc with the React test renderer. If you have
 * a solution, please do send a PR.
 */
describe('WalletProvider when the environment is `MOBILE_WEB`', () => {
    let ref: React.RefObject<TestRefType>;
    let root: ReturnType<typeof createRoot>;
    let container: HTMLElement;
    let fooWalletAdapter: MockWalletAdapter;
    let adapters: Adapter[];

    function renderTest(props: Omit<WalletProviderProps, 'appIdentity' | 'children' | 'cluster' | 'wallets'>) {
        act(() => {
            root.render(
                <WalletProvider {...props} localStorageKey={WALLET_NAME_CACHE_KEY} wallets={adapters}>
                    <TestComponent ref={ref} />
                </WalletProvider>
            );
        });
    }

    class FooWalletAdapter extends MockWalletAdapter {
        name = 'FooWallet' as WalletName<'FooWallet'>;
        url = 'https://foowallet.com';
        icon = 'foo.png';
        publicKey = new PublicKey('Foo11111111111111111111111111111111111111111');
    }

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks().resetModules();
        jest.mocked(useConnection).mockImplementation(() => ({
            connection: {
                rpcEndpoint: 'https://fake-endpoint-for-test.com',
            } as Connection,
        }));
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        ref = createRef();
        fooWalletAdapter = new FooWalletAdapter();
        adapters = [fooWalletAdapter];
    });
    afterEach(() => {
        if (root) {
            root.unmount();
        }
    });
    describe('given a selected wallet', () => {
        beforeEach(async () => {
            fooWalletAdapter.readyStateValue = WalletReadyState.NotDetected;
            renderTest({});
            await act(async () => {
                ref.current?.getWalletContextState().select('FooWallet' as WalletName<'FooWallet'>);
                await Promise.resolve(); // Flush all promises in effects after calling `select()`.
            });
            expect(ref.current?.getWalletContextState().wallet?.readyState).toBe(WalletReadyState.NotDetected);
        });
        it('should store the wallet name', () => {
            expect(localStorage.setItem).toHaveBeenCalledWith(
                WALLET_NAME_CACHE_KEY,
                JSON.stringify(fooWalletAdapter.name)
            );
        });
        describe('when the wallet disconnects of its own accord', () => {
            beforeEach(() => {
                jest.clearAllMocks();
                act(() => {
                    fooWalletAdapter.disconnect();
                });
            });
            it('should clear the stored wallet name', () => {
                expect(localStorage.removeItem).toHaveBeenCalledWith(WALLET_NAME_CACHE_KEY);
            });
        });
        describe('when the wallet disconnects as a consequence of the window unloading', () => {
            beforeEach(() => {
                jest.clearAllMocks();
                act(() => {
                    window.dispatchEvent(new Event('beforeunload'));
                    fooWalletAdapter.disconnect();
                });
            });
            it('should not clear the stored wallet name', () => {
                expect(localStorage.removeItem).not.toHaveBeenCalledWith(WALLET_NAME_CACHE_KEY);
            });
        });
    });
    describe('when there is no mobile wallet adapter in the adapters array', () => {
        it("creates a new mobile wallet adapter with the document's host as the uri of the `appIdentity`", () => {
            renderTest({});
            expect(jest.mocked(SolanaMobileWalletAdapter).mock.instances).toHaveLength(1);
            expect(jest.mocked(SolanaMobileWalletAdapter).mock.calls[0][0].appIdentity.uri).toBe(
                `${document.location.protocol}//${document.location.host}`
            );
        });
        it('creates a new mobile wallet adapter with the appropriate cluster for the given endpoint', () => {
            renderTest({});
            expect(jest.mocked(SolanaMobileWalletAdapter).mock.instances).toHaveLength(1);
            expect(jest.mocked(SolanaMobileWalletAdapter).mock.calls[0][0].cluster).toBe('fake-cluster-for-test');
        });
    });
    describe('when a custom mobile wallet adapter is supplied in the adapters array', () => {
        let customAdapter: Adapter;
        const CUSTOM_APP_IDENTITY = {
            uri: 'https://custom.com',
        };
        const CUSTOM_CLUSTER = 'devnet';
        beforeEach(() => {
            customAdapter = new SolanaMobileWalletAdapter({
                addressSelector: jest.fn() as unknown as AddressSelector,
                appIdentity: CUSTOM_APP_IDENTITY,
                authorizationResultCache: jest.fn() as unknown as AuthorizationResultCache,
                cluster: CUSTOM_CLUSTER,
                onWalletNotFound: jest.fn(),
            });
            adapters.push(customAdapter);
            jest.clearAllMocks();
        });
        it('does not load the custom mobile wallet adapter into state as the default', () => {
            renderTest({});
            expect(ref.current?.getWalletContextState().wallet?.adapter).not.toBe(customAdapter);
        });
        it('does not construct any further mobile wallet adapters', () => {
            renderTest({});
            expect(jest.mocked(SolanaMobileWalletAdapter).mock.calls.length).toBe(0);
        });
    });
    describe('when there exists no stored wallet name', () => {
        beforeEach(() => {
            (localStorage.getItem as jest.Mock).mockReturnValue(null);
        });
        it('loads no wallet into state', () => {
            renderTest({});
            expect(ref.current?.getWalletContextState().wallet).toBeNull();
        });
        it('loads no public key into state', () => {
            renderTest({});
            expect(ref.current?.getWalletContextState().publicKey).toBeNull();
        });
    });
    describe('when there exists a stored wallet name', () => {
        beforeEach(() => {
            (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify('FooWallet'));
        });
        it('loads the corresponding adapter into state', () => {
            renderTest({});
            expect(ref.current?.getWalletContextState().wallet?.adapter).toBeInstanceOf(FooWalletAdapter);
        });
        it('loads the corresponding public key into state', () => {
            renderTest({});
            expect(ref.current?.getWalletContextState().publicKey).toBe(fooWalletAdapter.publicKey);
        });
        it('sets state tracking variables to defaults', () => {
            renderTest({});
            expect(ref.current?.getWalletContextState()).toMatchObject({
                connected: false,
                connecting: false,
            });
        });
    });
    describe('autoConnect', () => {
        describe('given a mobile wallet adapter is connected', () => {
            beforeEach(async () => {
                renderTest({});
                await act(async () => {
                    ref.current?.getWalletContextState().select(SolanaMobileWalletAdapterWalletName);
                    await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                });
            });
            describe('when autoConnect is disabled', () => {
                beforeEach(() => {
                    renderTest({ autoConnect: false });
                });
                it('does not call `connect`', () => {
                    const adapter = ref.current?.getWalletContextState().wallet?.adapter as SolanaMobileWalletAdapter;
                    expect(adapter.connect).not.toHaveBeenCalled();
                    expect(adapter.autoConnect).not.toHaveBeenCalled();
                });
            });
            describe('when autoConnect is enabled', () => {
                beforeEach(() => {
                    renderTest({ autoConnect: true });
                });
                it('calls the connect method on the mobile wallet adapter', () => {
                    const adapter = ref.current?.getWalletContextState().wallet?.adapter as SolanaMobileWalletAdapter;
                    expect(adapter.connect).toHaveBeenCalled();
                    expect(adapter.autoConnect).not.toHaveBeenCalled();
                });
            });
        });
        describe('given a non-mobile wallet adapter is connected', () => {
            beforeEach(async () => {
                renderTest({});
                await act(async () => {
                    ref.current?.getWalletContextState().select('FooWallet' as WalletName<'FooWallet'>);
                    await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                });
            });
            describe('when autoConnect is disabled', () => {
                beforeEach(() => {
                    renderTest({ autoConnect: false });
                });
                it('does not call `autoConnect`', () => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const adapter = ref.current!.getWalletContextState().wallet!.adapter;
                    expect(adapter.connect).not.toHaveBeenCalled();
                    expect(adapter.autoConnect).not.toHaveBeenCalled();
                });
            });
            describe('when autoConnect is enabled', () => {
                beforeEach(() => {
                    renderTest({ autoConnect: true });
                });
                it('calls `connect`', () => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const adapter = ref.current!.getWalletContextState().wallet!.adapter;
                    expect(adapter.connect).toHaveBeenCalled();
                    expect(adapter.autoConnect).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe('onError', () => {
        let onError: jest.Mock;
        let errorThrown: WalletError;
        beforeEach(() => {
            errorThrown = new WalletError('o no');
            onError = jest.fn();
            renderTest({ onError });
        });
        describe('when the wallet emits an error', () => {
            let adapter: Adapter;
            beforeEach(() => {
                act(() => {
                    adapter = ref.current?.getWalletContextState().wallet?.adapter as SolanaMobileWalletAdapter;
                    adapter.emit('error', errorThrown);
                });
            });
            it('should fire the `onError` callback', () => {
                expect(onError).toHaveBeenCalledWith(errorThrown, adapter);
            });
        });
        describe('when window `beforeunload` event fires', () => {
            beforeEach(() => {
                act(() => {
                    window.dispatchEvent(new Event('beforeunload'));
                });
            });
            describe('then the wallet emits an error', () => {
                let adapter: Adapter;
                beforeEach(() => {
                    act(() => {
                        adapter = ref.current?.getWalletContextState().wallet?.adapter as SolanaMobileWalletAdapter;
                        adapter.emit('error', errorThrown);
                    });
                });
                it('should not fire the `onError` callback', () => {
                    expect(onError).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe('disconnect()', () => {
        describe('when there is already a wallet connected', () => {
            beforeEach(async () => {
                window.open = jest.fn();
                renderTest({});
                await act(async () => {
                    ref.current?.getWalletContextState().select('FooWallet' as WalletName<'FooWallet'>);
                    await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                });
                await act(() => {
                    ref.current?.getWalletContextState().connect();
                });
            });
            describe('and you select a different wallet', () => {
                beforeEach(async () => {
                    await act(async () => {
                        ref.current?.getWalletContextState().select('BarWallet' as WalletName<'BarWallet'>);
                        await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                    });
                });
                it('should disconnect the old wallet', () => {
                    expect(fooWalletAdapter.disconnect).toHaveBeenCalled();
                });
            });
            describe('and you select the same wallet', () => {
                beforeEach(async () => {
                    await act(async () => {
                        ref.current?.getWalletContextState().select('FooWallet' as WalletName<'FooWallet'>);
                        await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                    });
                });
                it('should not disconnect the old wallet', () => {
                    expect(fooWalletAdapter.disconnect).not.toHaveBeenCalled();
                });
            });
            describe('once disconnected', () => {
                beforeEach(async () => {
                    jest.clearAllMocks();
                    ref.current?.getWalletContextState().disconnect();
                    await Promise.resolve(); // Flush all promises in effects after calling `disconnect()`.
                });
                it('should clear the stored wallet name', () => {
                    expect(localStorage.removeItem).toHaveBeenCalledWith(WALLET_NAME_CACHE_KEY);
                });
                it('sets state tracking variables to defaults', () => {
                    renderTest({});
                    expect(ref.current?.getWalletContextState()).toMatchObject({
                        connected: false,
                        connecting: false,
                        publicKey: null,
                    });
                });
            });
        });
        describe('given a mobile wallet adapter is connected', () => {
            let mobileWalletAdapter: Adapter;
            beforeEach(async () => {
                renderTest({});
                await act(async () => {
                    ref.current?.getWalletContextState().select(SolanaMobileWalletAdapterWalletName);
                    await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                });
                mobileWalletAdapter = jest.mocked(SolanaMobileWalletAdapter).mock.results[0].value;
                await act(() => {
                    ref.current?.getWalletContextState().connect();
                });
            });
            describe('then a non-mobile wallet adapter is selected', () => {
                beforeEach(async () => {
                    renderTest({});
                    await act(async () => {
                        ref.current?.getWalletContextState().select('FooWallet' as WalletName<'FooWallet'>);
                        await Promise.resolve(); // Flush all promises in effects after calling `select()`.
                    });
                });
                it('does not call `disconnect` on the mobile wallet adapter', () => {
                    expect(mobileWalletAdapter.disconnect).not.toHaveBeenCalled();
                });
                it('should not clear the stored wallet name', () => {
                    expect(localStorage.removeItem).not.toHaveBeenCalled();
                });
            });
            describe('when the wallet disconnects of its own accord', () => {
                beforeEach(() => {
                    jest.clearAllMocks();
                    act(() => {
                        mobileWalletAdapter.disconnect();
                    });
                });
                it('should clear the stored wallet name', () => {
                    expect(localStorage.removeItem).toHaveBeenCalledWith(WALLET_NAME_CACHE_KEY);
                });
            });
            describe('when window beforeunload event fires', () => {
                beforeEach(() => {
                    jest.clearAllMocks();
                    act(() => {
                        window.dispatchEvent(new Event('beforeunload'));
                    });
                });
                describe('then the wallet disconnects of its own accord', () => {
                    beforeEach(() => {
                        jest.clearAllMocks();
                        act(() => {
                            mobileWalletAdapter.disconnect();
                        });
                    });
                    it('should clear the stored wallet name', () => {
                        expect(localStorage.removeItem).toHaveBeenCalledWith(WALLET_NAME_CACHE_KEY);
                    });
                    it('should clear out the state', () => {
                        expect(ref.current?.getWalletContextState()).toMatchObject({
                            connected: false,
                            connecting: false,
                            publicKey: null,
                        });
                    });
                });
            });
        });
    });
});
