const { convertDateToString } = require("./DateUtil");
const Role = require("../models/Role");

function buildRoleResponse(role) {
  if (!role) return null;
  return {
    id: role._id,
    roleName: role.roleName,
    roleDescription: role.roleDescription,
    roleModuleList: role.roleModuleList
      ? role.roleModuleList.map(rm => buildRoleModuleResponse(rm))
      : [],
    status: role.status,
    createdAt: convertDateToString(role.createdAt),
    updatedAt: convertDateToString(role.updatedAt),
  };
}

function buildRoleModuleResponse(roleModule) {
  if (!roleModule) return null;
  return {
    id: roleModule._id,
    roleId: roleModule.roleId,
    moduleId: roleModule.moduleId?._id || roleModule.moduleId,
    moduleName: roleModule.moduleName,
    moduleCode: roleModule.moduleCode,
    parentModuleName: roleModule.parentModuleName,
    moduleAction: roleModule.moduleAction,
    addAction: roleModule.addAction,
    updateAction: roleModule.updateAction,
    deleteAction: roleModule.deleteAction,
    downloadAction: roleModule.downloadAction,
    viewAction: roleModule.viewAction,
    status: roleModule.status,
    createdAt: convertDateToString(roleModule.createdAt),
    updatedAt: convertDateToString(roleModule.updatedAt),
  };
}

function buildModuleResponse(module) {
  if (!module) return null;
  return {
    id: module._id,
    moduleName: module.moduleName,
    parentModuleName: module.parentModuleName,
    moduleCode: module.moduleCode,
    addAction: module.addAction,
    updateAction: module.updateAction,
    deleteAction: module.deleteAction,
    downloadAction: module.downloadAction,
    viewAction: module.viewAction,
    status: module.status,
    createdAt: convertDateToString(module.createdAt),
    updatedAt: convertDateToString(module.updatedAt),
  };
}

function buildUserResponse(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name || "",
    email: user.email || "",
    countryCode: user.countryCode || "",
    mobileNumber: user.mobileNumber || "",
    address: user.address || "",
    city: user.city || "",
    country: user.country || "",
    profileUrl: user.profileUrl || "",
    status: user.status,
    profileCompleted: user.profileCompleted || false,
    roleId: user.roleId || "",
    mobileUserId: user.mobileUserId || null,
    createdAt: convertDateToString(user.createdAt),
    updatedAt: convertDateToString(user.updatedAt),
  };
}

async function buildUserRoleResponse(user) {
  if (!user) return null;

  let role = null;
  if (user.roleId) {
    role = await Role.findById(user.roleId).populate("roleModuleList");
  }

  return {
    id: user._id,
    name: user.name || "",
    email: user.email || "",
    countryCode: user.countryCode || "",
    mobileNumber: user.mobileNumber || "",
    address: user.address || "",
    city: user.city || "",
    country: user.country || "",
    profileUrl: user.profileUrl || "",
    status: user.status,
    profileCompleted: user.profileCompleted || false,
    roleId: user.roleId,
    mobileUserId: user.mobileUserId || null,
    createdAt: convertDateToString(user.createdAt),
    updatedAt: convertDateToString(user.updatedAt),
    roleResponse: role ? buildRoleResponse(role) : null,
  };
}

async function buildDharamshalaResponse(
  data
) {
  return {
    id: data._id,
    name: data.name || null,
    description: data.description || null,

    villageId:
      data.villageId?._id || null,

    villageName:
      data.villageId?.name || null,

    address: data.address || null,

    mobileNumber:
      data.mobileNumber || null,

    alternateMobileNumber:
      data.alternateMobileNumber || null,

    email: data.email || null,

    website: data.website || null,

    establishedYear:
      data.establishedYear || null,

    profileImage:
      data.profileImage || null,

    bannerImage:
      data.bannerImage || null,

    status: data.status || null,

    createdAt: data.createdAt,

    updatedAt: data.updatedAt,
  };
}
function buildCommitteeResponse(
  committees
) {
  return committees.map(
    (committee) => ({
      id: committee._id,

      committeeRole:
        committee.committeeRole,

      joiningDate:
        committee.joiningDate,

      endDate: committee.endDate,

      remarks: committee.remarks,

      status: committee.status,

      userResponse:
        committee.userId
          ? {
              id:
                committee.userId._id,

              userId:
                committee.userId._id,

              name:
                committee.userId
                  .name || "",

              profileImage:
                committee.userId
                  .profileUrl ||
                null,

              mobile:
                committee.userId
                  .mobileNumber ||
                null,
            }
          : null,
    })
  );
}


module.exports = {
  buildCommitteeResponse,
  buildDharamshalaResponse,
  buildUserResponse,
  buildUserRoleResponse,
  buildRoleResponse,
  buildRoleModuleResponse,
  buildModuleResponse,
};
