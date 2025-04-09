import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProfileResponse {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  image: string;
  bio: string;
  role: string;
  phone: string;
  location: string;
  company: string;
  pronouns: string;
  lien: string;
}

export interface ProfileRequest {
  firstname: string;
  lastname: string;
  email: string;
  image: File | null;
  role: string;
  bio: string;
  phone: string;
  location: string;
  company: string;
  pronouns: string;
  lien: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8222/api/v1/users';

  constructor(private http: HttpClient) {}

  // Get user profile
  getUserProfile(email: string): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.apiUrl}/${email}`);
  }

  // Update user profile
  updateUserProfile(email: string, profileData: ProfileRequest): Observable<ProfileResponse> {
    const formData = new FormData();
    
    // Log the incoming data
    console.log('Profile data received:', {
      firstname: profileData.firstname,
      lastname: profileData.lastname,
      email: profileData.email,
      role: profileData.role,
      bio: profileData.bio,
      phone: profileData.phone,
      location: profileData.location,
      company: profileData.company,
      pronouns: profileData.pronouns,
      lien: profileData.lien,
      hasImage: !!profileData.image,
      imageName: profileData.image?.name
    });
    
    // Append required fields
    formData.append('firstname', profileData.firstname);
    formData.append('lastname', profileData.lastname);
    formData.append('email', profileData.email);
    
    // Append optional fields with null checks
    if (profileData.role) formData.append('role', profileData.role);
    if (profileData.bio) formData.append('bio', profileData.bio);
    if (profileData.phone) formData.append('phone', profileData.phone);
    if (profileData.location) formData.append('location', profileData.location);
    if (profileData.company) formData.append('company', profileData.company);
    if (profileData.pronouns) formData.append('pronouns', profileData.pronouns);
    if (profileData.lien) formData.append('lien', profileData.lien);

    // Append image if it exists
    if (profileData.image) {
      formData.append('image', profileData.image);
      console.log('Image being uploaded:', {
        name: profileData.image.name,
        type: profileData.image.type,
        size: profileData.image.size
      });
    }

    // Log the FormData keys for debugging
    const formDataKeys: string[] = [];
    formData.forEach((value, key) => {
      formDataKeys.push(key);
    });
    console.log('FormData keys:', formDataKeys);

    return this.http.post<ProfileResponse>(
      `${this.apiUrl}/update-profile/${email}`, 
      formData,
      {
        headers: {} // Let the browser set the correct Content-Type for FormData
      }
    );
  }
  
  // Update user profile without image (fallback method)
  updateUserProfileBasic(email: string, profileData: Omit<ProfileRequest, 'image'>): Observable<ProfileResponse> {
    console.log('Using basic profile update without image upload');
    
    // Create a JSON object instead of FormData
    const basicProfileData = {
      firstname: profileData.firstname,
      lastname: profileData.lastname,
      email: profileData.email,
      role: profileData.role,
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      company: profileData.company || '',
      pronouns: profileData.pronouns || '',
      lien: profileData.lien || ''
    };

    return this.http.post<ProfileResponse>(
      `${this.apiUrl}/update-profile-basic/${email}`, 
      basicProfileData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
