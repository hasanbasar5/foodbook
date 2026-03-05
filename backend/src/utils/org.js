const hasOrganizationScope = (user) => Boolean(user && user.organizationId);

module.exports = {
  hasOrganizationScope,
};
