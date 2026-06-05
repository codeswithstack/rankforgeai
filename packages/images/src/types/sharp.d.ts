declare module 'sharp' {
  interface SharpInstance {
    webp(options?: { quality?: number }): SharpInstance
    avif(options?: { quality?: number }): SharpInstance
    toBuffer(): Promise<Buffer>
  }
  function sharp(input: Buffer): SharpInstance
  export default sharp
}
