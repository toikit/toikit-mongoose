
import mongoose from 'mongoose';
import { setData, getData, resolve, declare, getDeclaration, getConfig } from "@toikit/toikit";

let connections: any = {};

// Model
export function model(name: String, conn:any = 'default') {
  let accessName = '__db_' +conn + '_model_' + name;
  return resolve('model_' + accessName);
};

export function declareModel(names: any) {
  function binding(data) {
    let conn = data?.connection || 'default';
    let accessName = '__db_' + conn + '_model_' + data.name;
    if (getDeclaration('model_' + accessName)) return;

    let attributes = getData('model_attributes_' + accessName) || {};
    let options = getData('model_options_' + accessName) || {};
    let mounted = getData('model_mounted_' + accessName);

    const Schema = new mongoose.Schema(attributes, options);

    // Kiểm tra nếu có khai báo deletedAt là tự động thêm filter vào
    if (options.softDelete) withSoftDelete(Schema)
    
    mounted && mounted.forEach(e => {
      e(Schema);
    });


    let databaseConfig = getConfig('mongo')?.connections || {};
    
    if (!databaseConfig.hasOwnProperty(conn)) throw Error('Database connection ' + conn + ' is not exitst');
    if (!connections[conn]) {
      connections[conn] = mongoose.createConnection(databaseConfig[conn].uri, databaseConfig[conn]?.options);
    }

    const Model = connections[conn].model(data.name, Schema);
    declare('value', Model, 'model_' + accessName);
  }

  if (Array.isArray(names)) {
    names.forEach(name => {
      binding(name);
    });
  }
  else binding(names);
}

export function modelData(models: any, custom: any = {}) {
  function binding(d) {
    let data = {...d, ...custom}
    let name = data.name;
    let conn = data?.connection || 'default';
    let accessName = '__db_' +conn + '_model_' + name;
    setData('model_attributes_' + accessName, data.attributes);
    setData('model_options_' + accessName, data.options || {});
    setData('model_mounted_' + accessName, data.mounted ? [data.mounted] : []);
  }

  if (Array.isArray(models)) {
    models.forEach(model => {
      binding(model);
    });
  } else {
    binding(models);
  }
};

export function withSoftDelete(schema: mongoose.Schema) {
  // Thêm trường deletedAt nếu chưa có
  if (!schema.path('deletedAt')) {
    schema.add({
      deletedAt: { type: Date, default: null }
    })
  }

  // Middleware tự động bỏ bản ghi bị xoá
  const autoExcludeDeleted = function (this: mongoose.Query<any, any>) {
    this.where({ deletedAt: null });
  }

  const middlewareTargets = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'count',
    'countDocuments'
    // Không cần findById vì là alias của findOne
  ]
  middlewareTargets.forEach((hook: any) => schema.pre(hook, autoExcludeDeleted))

  // Static method để soft-delete
  schema.statics.softDelete = async function (filter: any) {
    return this.updateMany(filter, { deletedAt: new Date() })
  }

  // Instance method nếu bạn muốn gọi từ doc instance
  schema.methods.softDelete = async function () {
    this.deletedAt = new Date()
    return this.save()
  }

  // Hook để thêm điều kiện vào mỗi lần gọi aggregate
  schema.pre('aggregate', function (next) {
    // Kiểm tra pipeline và tìm $match
    const pipeline = this.pipeline();
    
    // Tìm stage $match trong pipeline, nếu không có thì thêm $match vào
    const matchStage = pipeline.find(stage => '$match' in stage);

    if (!matchStage) {
      // Nếu không có $match, thêm điều kiện vào đầu pipeline
      this.match({ deletedAt: null }); // Hoặc { isDeleted: false }
    } else {
      // Nếu có $match, thêm điều kiện vào phần của $match
      matchStage.$match = { ...matchStage.$match, deletedAt: null }; // Hoặc matchStage.$match.isDeleted = false;
    }
    next();
  });
}