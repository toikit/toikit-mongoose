export declare const paginate: ({ model, filter, select, options, page, pageSize }: any) => Promise<{
    totalItems: any;
    currentPage: any;
    pageSize: any;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: any;
    lastPage: number;
    items: any;
}>;
