"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = void 0;
const model_1 = require("./model");
const paginate = async ({ model, filter, select, options, page, pageSize }) => {
    if (typeof model == 'string')
        model = (0, model_1.model)(model);
    page = parseInt(page);
    page = page < 1 ? 1 : page;
    pageSize = parseInt(pageSize);
    pageSize = pageSize < 2 ? 1 : pageSize;
    let items = options || [];
    if (select)
        items.push({ $project: select });
    items.push({ $skip: (page - 1) * pageSize });
    items.push({ $limit: pageSize });
    const result = await model.aggregate([
        ...filter,
        {
            $facet: {
                totalItems: [
                    { $count: "total" }
                ],
                items
            }
        }
    ]);
    let totalItems = result?.[0]?.totalItems?.[0]?.total || 0;
    let lastPage = Math.ceil(totalItems / pageSize);
    if (lastPage == 0)
        lastPage = 1;
    return {
        totalItems,
        currentPage: page,
        pageSize: pageSize,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        lastPage,
        items: result?.[0]?.items || []
    };
};
exports.paginate = paginate;
//# sourceMappingURL=utils.js.map