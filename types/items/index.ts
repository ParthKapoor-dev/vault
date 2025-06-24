export type Items = Item[];
export type Item = Directory | File;

export interface Directory {
  type: "Directory";
  slug: string;
  title: string;
  createdAt: number;
}

export interface File {
  type: "File";
  slug: string;
  title: string;
  createdAt: number;
}
