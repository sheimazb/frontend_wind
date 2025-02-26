import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ProfileResponse {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  image: string;
  bio: string;
  role:string;
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
  role:string;
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
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  constructor(private http: HttpClient) {}

  // Récupérer les informations du profil
  getUserProfile(email: string): Observable<ProfileResponse> {
    const token = this.getToken();
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };

    return this.http.get<ProfileResponse>(`${this.apiUrl}/${email}`, httpOptions);
  }

  // Mettre à jour le profil utilisateur
  updateUserProfile(email: string, profileData: ProfileRequest): Observable<ProfileResponse> {
    const token = this.getToken();
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
    
    // Debug: Log what's being sent
    console.log('Updating profile for:', email);
    console.log('Token available:', !!token);
    console.log('Profile data:', {
      ...profileData,
      image: profileData.image ? profileData.image.name : 'No image'
    });
    
    const formData = new FormData();
    formData.append('firstname', profileData.firstname);
    formData.append('lastname', profileData.lastname);
    formData.append('email', profileData.email);
    if (profileData.image) {
      formData.append('image', profileData.image);
    }
    formData.append('bio', profileData.bio || '');
    formData.append('phone', profileData.phone || '');
    formData.append('role', profileData.role || '');
    formData.append('location', profileData.location || '');
    formData.append('company', profileData.company || '');
    formData.append('pronouns', profileData.pronouns || '');
    formData.append('lien', profileData.lien || '');
    
    return this.http.post<ProfileResponse>(
      `${this.apiUrl}/update-profile/${email}`, 
      formData, 
      httpOptions
    ).pipe(
      catchError(error => {
        console.error('Profile update error details:', error);
        // Log the response text if available
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            console.error('Error response content:', reader.result);
          };
          reader.readAsText(error.error);
        }
        throw error;
      })
    );
  }
}