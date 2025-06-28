"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = model;
exports.declareModel = declareModel;
exports.modelData = modelData;
exports.withSoftDelete = withSoftDelete;
const mongoose_1 = __importDefault(require("mongoose"));
const toikit_1 = require("@toikit/toikit");
let connections = {};
function model(name, conn = 'default') {
    let accessName = '__db_' + conn + '_model_' + name;
    return (0, toikit_1.resolve)('model_' + accessName);
}
;
function declareModel(names) {
    function binding(data) {
        let conn = data?.connection || 'default';
        let accessName = '__db_' + conn + '_model_' + data.name;
        if ((0, toikit_1.getDeclaration)('model_' + accessName))
            return;
        let attributes = (0, toikit_1.getData)('model_attributes_' + accessName) || {};
        let options = (0, toikit_1.getData)('model_options_' + accessName) || {};
        let mounted = (0, toikit_1.getData)('model_mounted_' + accessName);
        const Schema = new mongoose_1.default.Schema(attributes, options);
        if (options.softDelete)
            withSoftDelete(Schema);
        mounted && mounted.forEach(e => {
            e(Schema);
        });
        let databaseConfig = (0, toikit_1.getConfig)('mongo')?.connections || {};
        if (!databaseConfig.hasOwnProperty(conn))
            throw Error('Database connection ' + conn + ' is not exitst');
        if (!connections[conn]) {
            connections[conn] = mongoose_1.default.createConnection(databaseConfig[conn].uri, databaseConfig[conn]?.options);
        }
        const Model = connections[conn].model(data.name, Schema);
        (0, toikit_1.declare)('value', Model, 'model_' + accessName);
    }
    if (Array.isArray(names)) {
        names.forEach(name => {
            binding(name);
        });
    }
    else
        binding(names);
}
function modelData(models, custom = {}) {
    function binding(d) {
        let data = { ...d, ...custom };
        let name = data.name;
        let conn = data?.connection || 'default';
        let accessName = '__db_' + conn + '_model_' + name;
        (0, toikit_1.setData)('model_attributes_' + accessName, data.attributes);
        (0, toikit_1.setData)('model_options_' + accessName, data.options || {});
        (0, toikit_1.setData)('model_mounted_' + accessName, data.mounted ? [data.mounted] : []);
    }
    if (Array.isArray(models)) {
        models.forEach(model => {
            binding(model);
        });
    }
    else {
        binding(models);
    }
}
;
function withSoftDelete(schema) {
    if (!schema.path('deletedAt')) {
        schema.add({
            deletedAt: { type: Date, default: null }
        });
    }
    const autoExcludeDeleted = function () {
        this.where({ deletedAt: null });
    };
    const middlewareTargets = [
        'find',
        'findOne',
        'findOneAndUpdate',
        'count',
        'countDocuments'
    ];
    middlewareTargets.forEach((hook) => schema.pre(hook, autoExcludeDeleted));
    schema.statics.softDelete = async function (filter) {
        return this.updateMany(filter, { deletedAt: new Date() });
    };
    schema.methods.softDelete = async function () {
        this.deletedAt = new Date();
        return this.save();
    };
    schema.pre('aggregate', function (next) {
        const pipeline = this.pipeline();
        const matchStage = pipeline.find(stage => '$match' in stage);
        if (!matchStage) {
            this.match({ deletedAt: null });
        }
        else {
            matchStage.$match = { ...matchStage.$match, deletedAt: null };
        }
        next();
    });
}
//# sourceMappingURL=model.js.map