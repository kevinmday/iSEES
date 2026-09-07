export async function resolve(specifier, context, nextResolve) {
  try { return await nextResolve(specifier, context); }
  catch (error) {
    if (!(error && error.code === "ERR_MODULE_NOT_FOUND") || !(specifier.startsWith(".") || specifier.startsWith("/"))) throw error;
    try { return await nextResolve(`${specifier}.ts`, context); }
    catch { return nextResolve(`${specifier}/index.ts`, context); }
  }
}
