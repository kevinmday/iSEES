export async function resolve(specifier, context, nextResolve) {
  try { return await nextResolve(specifier, context); }
  catch (error) {
    if (!(error && (error.code === "ERR_MODULE_NOT_FOUND" || error.code === "ERR_UNSUPPORTED_DIR_IMPORT")) || !(specifier.startsWith(".") || specifier.startsWith("/"))) throw error;
    if (error.code === "ERR_UNSUPPORTED_DIR_IMPORT") return nextResolve(`${specifier}/index.ts`, context);
    try { return await nextResolve(`${specifier}.ts`, context); }
    catch { return nextResolve(`${specifier}/index.ts`, context); }
  }
}
