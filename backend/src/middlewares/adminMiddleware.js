export default function adminMiddleware(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res
      .status(403)
      .json({ message: "Acesso restrito a administradores" });
  }

  return next();
}
