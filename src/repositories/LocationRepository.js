const Location = require("../models/Location");

const create = (data) => Location.create(data);
const findById = (id) => Location.findById(id);
const update = (id, data) => Location.findByIdAndUpdate(id, data, { new: true });
const findAll = (query = {}) => Location.find(query).sort({ district: 1, tehsil: 1, village: 1 });
const countDocuments = (query = {}) => Location.countDocuments(query);
const findDistinct = (field, query = {}) => Location.distinct(field, query);
const findDistinctAndTehsil = (field, query = {}) => Location.distinct(field, query);

module.exports = { create, findById, update, findAll, countDocuments, findDistinct, findDistinctAndTehsil };
