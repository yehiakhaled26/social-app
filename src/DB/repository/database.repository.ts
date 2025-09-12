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
          Types,
          DeleteResult,
        } from "mongoose";

export type Lean<T> = HydratedDocument <FlattenMaps<T>> 
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
  ) : Promise<Lean<TDocument> | HydratedDocument<TDocument>| null> {
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



async updateOne(p0: { filter: { _id: string | Types.ObjectId | undefined; freezeAt: any; }; }, p1: { $exists: boolean; }, {
    filter, update, options,
}: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
}) 
: Promise<UpdateWriteOpResult >
 {
  return await this.model.updateOne(filter, 
    {...update , $inc:{version:1}}, options);
}

async deleteOne(p0: { filter: { _id: string | Types.ObjectId | undefined; freezeAt: any; }; }, p1: { $exists: boolean; }, {
    filter,
}: {
    filter: RootFilterQuery<TDocument>;
}) 
: Promise< DeleteResult >
 {
  return await this.model.deleteOne(filter);
}

async findByIdAndUpdate({
  id,
  update,
  options,
}:
{
  id: Types.ObjectId;
  update?: UpdateQuery<TDocument>;
  options?: QueryOptions<TDocument> | null;
}) 
: Promise<HydratedDocument<TDocument> | Lean<TDocument> | null> {
 
  return await this.model.findByIdAndUpdate(
    id, 
    {...update , $inc:{version:1}},
     options);
}


}