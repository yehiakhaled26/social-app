import {Model,
    RootFilterQuery,
    ProjectionType,
     HydratedDocument,
     CreateOptions,
      QueryOptions,
       FlattenMaps,
        PopulateOptions,
         UpdateQuery,
          MongooseUpdateQueryOptions,
          UpdateWriteOpResult,
        } from "mongoose";

export type lean<T> = HydratedDocument <FlattenMaps<T>> 
export abstract class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async findOne(
    {
      filter,
      select,
      options 
    }: {
      filter: RootFilterQuery<TDocument>;
      select?: ProjectionType<TDocument> | null;
      options?: QueryOptions<TDocument>| null;
    }
  ) : Promise<lean<TDocument> | HydratedDocument<TDocument>| null> {
    const doc = this.model.findOne(filter).select(select || "");

    if (options?.populate){
        doc.populate(options.populate as PopulateOptions[])
    }

    if (options?.lean){
        doc.lean(options.lean)
    }
    return await doc.exec(); 
  }

  async create(
    {
      data,
      options,
    }: {
      data: Partial<TDocument>[];
      options?: CreateOptions | undefined;
    }
  ): Promise<HydratedDocument<TDocument>[] | undefined> {
    return await this.model.create(data, options);
  }



async updateOne({
  filter,
  update,
  options,
}:
{
  filter: RootFilterQuery<TDocument>;
  update: UpdateQuery<TDocument>;
  options?: MongooseUpdateQueryOptions<TDocument> | null;
}) 
: Promise<UpdateWriteOpResult >
 {
  return this.model.updateOne(filter, {...update , $inc:{version:1}}, options);
}




}