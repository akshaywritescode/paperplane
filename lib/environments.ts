export type Environment = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
};

export type EnvVariable = {
  id: string;
  environmentId: string;
  key: string;
  value: string;
  enabled: boolean;
};

/** Replace {{key}} placeholders using the active environment's variable map. */
export function interpolate(str: string, vars: Record<string, string>): string {
  if (!str || Object.keys(vars).length === 0) return str;
  return str.replace(/\{\{([\w.-]+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
  );
}
