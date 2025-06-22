export interface CommunityMember {
  _id: string;
  fullname: string;
}

export interface Community {
  _id: string;
  name: string;
  description: string;
  members: CommunityMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMessage {
  _id?: string;
  community: string;
  sender: {
    _id: string;
    fullname: string;
  };
  content: string;
  createdAt?: Date;
}