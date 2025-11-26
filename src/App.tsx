import { sdk } from '@farcaster/frame-sdk'
import { useEffect, useState } from 'react'
import { useAccount, useConnect, useReadContract, useWriteContract } from 'wagmi'
import { config } from './wagmi'
import { switchChain } from 'wagmi/actions'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()

  // ★ BRO ADD — chỉ thêm state, không đổi UI
  const [fid, setFid] = useState<bigint | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // ★ BRO ADD — lấy dữ liệu từ Farcaster context
  useEffect(() => {
    async function loadCtx() {
      const ctx = await sdk.context.getContext()

      if (ctx?.user?.fid) setFid(BigInt(ctx.user.fid))
      if (ctx?.user?.avatar?.url) setAvatarUrl(ctx.user.avatar.url)
    }
    loadCtx()
  }, [])

  useEffect(() => {
    if (isConnected) {
      switchChain(config, { chainId: config.chains[0].id })
      refetchBalanceOf()
    } else {
      connect({ connector: connectors[0] })
    }
  }, [isConnected])

  const { writeContract, reset, isPending, isSuccess } = useWriteContract()

  // ★ BRO UPDATE — contract mới Base
  const CONTRACT = '0x735e836E25f16cA8F123B02D264246574EC2CCC0'

  const { data: balanceOf, refetch: refetchBalanceOf } = useReadContract({
    address: CONTRACT,
    abi: [
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: '', type: 'address', internalType: 'address' }],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  })

  useEffect(() => {
    if (balanceOf !== undefined) reset()
  }, [balanceOf])

  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: CONTRACT,
    abi: [
      {
        type: 'function',
        name: 'totalSupply',
        inputs: [],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'totalSupply',
    args: [],
  })

  useEffect(() => {
    if (!totalSupply) return
    setInterval(() => refetchTotalSupply(), 7000)
  }, [totalSupply])

  useEffect(() => {
    if (!isSuccess) return
    alert('You minted Lil Chogstars!')
    ;(async () => await refetchBalanceOf())()

    setTimeout(() => {
      refetchBalanceOf()
      refetchTotalSupply()
    }, 3000)

    setTimeout(refetchBalanceOf, 5000)
  }, [isSuccess])

  useEffect(() => {
    sdk.actions.ready()
  }, [])

  useEffect(() => {
    let id: ReturnType<typeof setInterval>
    if (isConnected) {
      clearInterval(id! && 0)
    } else if (window.self !== window.top) {
      id = setInterval(() => connect({ connector: connectors[0] }), 1500)
    }
  }, [isConnected])

  return (
    <>
      <main className='flex flex-col gap-10 w-full sm:max-w-xs flex-1'>
        <div className='flex-col flex gap-6 '>
          <div className='flex flex-col gap-1.5'>
            <h1 className='font-bold text-center text-5xl'>lil chogstars</h1>
          </div>

          <h3 className='font-bold text-2xl text-center tabular-nums'>
            {(totalSupply ?? 4400000).toLocaleString()} / ∞
          </h3>

          <div className='flex px-4 '>
            <img
              className='rounded-2xl aspect-square drop-shadow-[0px_0px_1rem_#2d235acc]'
              src={'/lilchogstars.avif'}
            />
          </div>

          <h3 className='font-bold text-2xl text-center tabular-nums'>
            You minted: x{balanceOf?.toString() || '?'}
          </h3>
        </div>

        {isConnected ? (
          <button
            disabled={
              balanceOf === undefined ||
              balanceOf >= 10 ||
              isPending ||
              isSuccess ||
              !fid ||
              !avatarUrl
            }
            className='bg-[#362e6f] text-white flex justify-center items-center font-semibold text-2xl h-14 px-7 rounded-2xl drop-shadow-[0px_0px_1rem_#2d235acc] cursor-pointer disabled:cursor-not-allowed'
            onClick={async () => {
              await switchChain(config, { chainId: config.chains[0].id })

              // ★ BRO UPDATE — mint(fid, avatarUrl)
              writeContract({
                abi: [
                  {
                    type: 'function',
                    name: 'mint',
                    inputs: [
                      { name: 'fid', type: 'uint256', internalType: 'uint256' },
                      { name: 'avatarUrl', type: 'string', internalType: 'string' },
                    ],
                    outputs: [],
                    stateMutability: 'payable',
                  },
                ],
                address: CONTRACT,
                functionName: 'mint',
                args: [fid!, avatarUrl],
                value: 0n,
              })
            }}
          >
            {balanceOf
              ? balanceOf >= 10
                ? 'Cannot Mint More'
                : isPending || isSuccess
                ? 'Minting'
                : 'Free Mint'
              : 'Free Mint'}
          </button>
        ) : (
          <div className='flex px-4 flex-col '>
            <a
              href='https://warpcast.com/~/mini-apps/launch?domain=lilchogstars.pages.dev'
              className='bg-[#362e6f] text-white flex justify-center items-center font-semibold text-2xl h-14 px-7 rounded-2xl drop-shadow-[0px_0px_1rem_#2d235acc]'
            >
              Open in Warpcast
            </a>
          </div>
        )}
      </main>

      <footer className='flex flex-col gap-12 w-full items-center text-center'>
        <div className='flex items-center gap-6'>
          <a href='https://x.com/chogstarrr' target='_blank' className='w-10'>
            {/* giữ nguyên icon */}
            <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 512 512'>
              <path
                fill='#0b3800'
                d='M389.2 48h70.6L305.6 224.2L487 464H345L233.7 318.6L106.5 464H35.8l164.9-188.5L26.8 48h145.6l100.5 132.9zm-24.8 373.8h39.1L151.1 88h-42z'
              />
            </svg>
          </a>

          <a href='https://github.com/voztoy/vnnee' target='_blank' className='w-10'>
            {/* giữ nguyên icon */}
            <svg xmlns='http://www.w3.org/2000/svg' width='31' height='32' viewBox='0 0 496 512'>
              <path
                fill='#0b3800'
                d='M165.9 397.4c0 2-2.3 3.6-5.2 3.6c-3.3.3-5.6-1.3-5.6-3.6c0-2 2.3-3.6 5.2-3.6c3-.3 5.6 1.3 5.6 3.6m-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9c2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3m44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9c.3 2 2.9 3.3 5.9 2.6c2.9-.7 4.9-2.6 4.6-4.6c-.3-1.9-3-3.2-5.9-2.9M244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2c12.8 2.3 17.3-5.6 17.3-12.1c0-6.2-.3-40.4-.3-61.4c0 0-70 15-84.7-29.8c0 0-11.4-29.1-27.8-36.6c0 0-22.9-15.7 1.6-15.4c0 0 24.9 2 38.6 25.8c21.9 38.6 58.6 27.5 72.9 20.9c2.3-16 8.8-27.1 16-33.7c-55.9-6.2-112.3-14.3-112.3-110.5c0-27.5 7.6-41.3 23.6-58.9c-2.6-6.5-11.1-33.3 2.6-67.9c20.9-6.5 69 27 69 27c20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27c13.7 34.7 5.2 61.4 2.6 67.9c16 17.7 25.8 31.5 25.8 58.9c0 96.5-58.9 104.2-114.8 110.5c9.2 7.9 17 22.9 17 46.4c0 33.7-.3 75.4-.3 83.6c0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252C496 113.3 383.5 8 244.8 8'
              />
            </svg>
          </a>
        </div>
      </footer>
    </>
  )
}

export default App
