export interface PartnerResponse{
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  image: string;
  role:string;
  phone: string;
  location: string;
  company: string;
  lien: string;
  accountLocked:boolean;
}
export interface PartnerRequest {
    firstname: string;
    lastname: string;
    email: string;
    image: File | null;
    role:string;
    phone: string;
    location: string;
    company: string;
    lien: string;
    accountLocked:boolean;
  }
export interface PartnerAccountStatusRequest{
  accountLocked:boolean;
}
export interface PartnerAccountStatusResponse{
  accountLocked:boolean;
}