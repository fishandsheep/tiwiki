export function isAdminRequestPath(path: string) {
  return path === '/admin'
    || path.startsWith('/admin/')
    || path === '/api/admin'
    || path.startsWith('/api/admin/')
}
