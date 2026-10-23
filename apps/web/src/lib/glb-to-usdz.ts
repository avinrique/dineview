/**
 * Converts an uploaded .glb into a .usdz in the browser, so iPhone guests can
 * open AR Quick Look in any browser (Safari converts on the fly, Chrome can't).
 * three.js is loaded on demand: only the dish editor needs this.
 */
export async function glbToUsdz(file: File): Promise<File> {
  const [{ GLTFLoader }, { USDZExporter }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/exporters/USDZExporter.js'),
  ]);
  const gltf = await new GLTFLoader().parseAsync(await file.arrayBuffer(), '');
  const bytes = await new USDZExporter().parseAsync(gltf.scene, { maxTextureSize: 2048, quickLookCompatible: true });
  return new File([bytes as Uint8Array<ArrayBuffer>], `${file.name.replace(/\.glb$/i, '')}.usdz`, { type: 'model/vnd.usdz+zip' });
}
