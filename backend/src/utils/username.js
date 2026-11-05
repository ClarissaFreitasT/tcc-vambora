const USERNAME_PATTERN = /^[a-z0-9._]+$/;

export function normalizarUsername(username) {
  if (typeof username !== "string") return null;

  const valorNormalizado = username.trim().toLowerCase();
  return USERNAME_PATTERN.test(valorNormalizado) ? valorNormalizado : null;
}

export function usernameValido(username) {
  return normalizarUsername(username) !== null;
}
