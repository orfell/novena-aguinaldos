// js/data.js
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar " + path);
  return await res.json();
}
