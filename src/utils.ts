export const paginate = async ({model, filter, select, options, page, pageSize}: any) => {
  page = parseInt(page);
  page = page < 1 ? 1 : page;
  pageSize = parseInt(pageSize);
  pageSize = pageSize < 2 ? 1 : pageSize;

  // Get all items
  const result = await model.aggregate([
    { $match: filter },
    {
      $facet: {
        totalItems: [
          { $count: "total" }
        ],
        items: [
          ...options,
          { $project: select },
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize }
        ]
      }
    }
  ]);
  
  let totalItems = result?.[0]?.totalItems?.[0]?.total || 0;
  let lastPage = Math.ceil(totalItems / pageSize);
  if (lastPage == 0) lastPage = 1;

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
