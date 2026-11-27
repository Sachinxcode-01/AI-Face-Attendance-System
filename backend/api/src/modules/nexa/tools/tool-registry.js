'use strict';

const { authorizeToolCall } = require('../security/tool-authorisation');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(toolDef) {
    if (!toolDef?.name || typeof toolDef.execute !== 'function') {
      throw new Error('Invalid tool definition');
    }
    this.tools.set(toolDef.name, {
      timeoutMs: 6000,
      allowedRoles: [],
      requiresWardAuth: false,
      ...toolDef,
    });
  }

  get(name) {
    return this.tools.get(name) || null;
  }

  listForRole(role) {
    const r = String(role || 'student').toLowerCase();
    return [...this.tools.values()]
      .filter((t) => !t.allowedRoles.length || t.allowedRoles.includes(r))
      .map(({ name, description, allowedRoles, requiresConfirmation }) => ({
        name,
        description,
        allowedRoles,
        requiresConfirmation: Boolean(requiresConfirmation),
      }));
  }

  async execute(name, args = {}, authCtx = {}) {
    const tool = this.get(name);
    if (!tool) {
      return { ok: false, tool: name, error: `Unknown tool: ${name}` };
    }

    const authz = await authorizeToolCall(tool, args, authCtx);
    if (!authz.allowed) {
      return { ok: false, tool: name, denied: true, error: authz.reason };
    }

    if (tool.schema) {
      const parsed = tool.schema.safeParse(args);
      if (!parsed.success) {
        return {
          ok: false,
          tool: name,
          error: `Invalid tool arguments: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
        };
      }
      args = parsed.data;
    }

    const started = Date.now();
    try {
      const result = await Promise.race([
        tool.execute(args, authCtx),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Tool '${name}' timed out after ${tool.timeoutMs}ms`)), tool.timeoutMs)
        ),
      ]);
      return {
        ok: true,
        tool: name,
        latencyMs: Date.now() - started,
        data: result,
      };
    } catch (err) {
      return {
        ok: false,
        tool: name,
        latencyMs: Date.now() - started,
        error: err.message || 'Tool execution failed',
      };
    }
  }
}

module.exports = { ToolRegistry };
