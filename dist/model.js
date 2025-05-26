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
function model(name) {
    return (0, toikit_1.resolve)('model_' + name);
}
;
function declareModel(names) {
    function binding(name) {
        if (typeof name == 'object')
            name = name.name;
        if ((0, toikit_1.getDeclaration)('model_' + name))
            return;
        let attributes = (0, toikit_1.getData)('model_attributes_' + name);
        let options = (0, toikit_1.getData)('model_options_' + name);
        let mounted = (0, toikit_1.getData)('model_mounted_' + name);
        let conn = (0, toikit_1.getData)('model_connection_' + name);
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
        const Model = connections[conn].model(name, Schema);
        (0, toikit_1.declare)('value', Model, 'model_' + name);
    }
    if (Array.isArray(names)) {
        names.forEach(name => {
            binding(name);
        });
    }
    else
        binding(names);
}
function modelData(models) {
    function binding(data) {
        let name = data.name;
        let conn = data?.connection || 'default';
        (0, toikit_1.setData)('model_attributes_' + name, data.attributes);
        (0, toikit_1.setData)('model_connection_' + name, conn);
        (0, toikit_1.setData)('model_options_' + name, data.options || {});
        (0, toikit_1.setData)('model_mounted_' + name, data.mounted ? [data.mounted] : []);
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