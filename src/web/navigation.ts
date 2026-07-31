export function navigate(path: string, replace = false) {
  if (replace) window.history.replaceState(null, "", `#${path}`);
  else window.location.hash = path;
  window.dispatchEvent(new Event("hashchange"));
}

export function back() {
  window.history.back();
}

export function searchParams() {
  return Object.fromEntries(new URL(window.location.href).searchParams);
}
