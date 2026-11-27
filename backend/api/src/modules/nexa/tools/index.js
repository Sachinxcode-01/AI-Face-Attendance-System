'use strict';

const { ToolRegistry } = require('./tool-registry');
const { registerAttendanceTools } = require('./attendance.tools');
const { registerAcademicTools } = require('./academic.tools');
const { registerLeaveAndCorrectionTools } = require('./leave.tools');
const { registerPlatformAndAdminTools } = require('./platform.tools');

const registry = new ToolRegistry();
registerAttendanceTools(registry);
registerAcademicTools(registry);
registerLeaveAndCorrectionTools(registry);
registerPlatformAndAdminTools(registry);

module.exports = registry;
