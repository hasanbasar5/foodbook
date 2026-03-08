const OWNER_USER_ID = 3;

const isOwnerUser = (user) => Boolean(user && Number(user.id) === OWNER_USER_ID);

module.exports = {
  OWNER_USER_ID,
  isOwnerUser,
};
