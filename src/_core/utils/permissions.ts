/**
 * Verifica se um usuário do ERP possui permissão para acessar uma funcionalidade
 * 
 * @param user - Objeto de usuário da sessão
 * @param permissionKey - Chave da permissão a ser checada
 * @returns boolean indicando se o acesso é permitido
 */
export function hasPermission(user: any, permissionKey: string): boolean {
  if (!user) return false;
  
  // Administradores do ERP e Trakto Admins possuem acesso ilimitado por padrão
  if (user.role === "admin" || user.role === "trakto_admin") return true;

  // Se o usuário não tiver permissões explícitas no banco, negamos por padrão
  if (!user.permissions) return false;

  try {
    const perms = typeof user.permissions === "string"
      ? JSON.parse(user.permissions)
      : user.permissions;
    
    return !!perms[permissionKey];
  } catch (error) {
    console.error("[permissions] Erro ao parsear permissões:", error);
    return false;
  }
}
