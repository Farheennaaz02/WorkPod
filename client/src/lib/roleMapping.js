// Map between client role names and database role names
export const clientToDbRole = {
  sde: 'dev',
  hr: 'hr',
  pm: 'pm',
  ml_intern: 'ml_intern',
  sde_intern: 'sd_intern',
};

export const dbToClientRole = {
  dev: 'sde',
  hr: 'hr',
  pm: 'pm',
  ml_intern: 'ml_intern',
  sd_intern: 'sde_intern',
};

export function getDbRole(clientRole) {
  return clientToDbRole[clientRole] || clientRole;
}

export function getClientRole(dbRole) {
  return dbToClientRole[dbRole] || dbRole;
}
