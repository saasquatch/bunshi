let instCount = 0;

export function instanceId() {
  return Symbol(`bunshi.instance ${instCount++}`);
}
