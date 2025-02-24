import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogSettingsProfielComponent } from '../../components/dialog/dialog-settings-profiel/dialog-settings-profiel.component';


interface ProfileData {
  firstname: string;
  lastname: string;
  role: string;
  pronouns: string;
  bio: string;
  location: string;
  github: string;
  company: string;
  phone: string;
}

interface ContributionDay {
  date: string;
  count: number;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule]
})
export class ProfileComponent implements OnInit {
  isEditing = false;
  profileImage = 'https://scontent.ftun10-2.fna.fbcdn.net/v/t39.30808-1/414436534_1743096249531026_2932049899671718007_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=102&ccb=1-7&_nc_sid=e99d92&_nc_ohc=xnb4yxNFdnAQ7kNvgEP2Ttl&_nc_oc=AdgWQUBnlnJh3VbzQXqo2ORN8mdKqPUYA_9lprqOBWTTnd1bnnZTRr2qMdWAWGJsNEc&_nc_zt=24&_nc_ht=scontent.ftun10-2.fna&_nc_gid=AC-4RsBAR9uOVrrfSLtzyOD&oh=00_AYB4g9AwO38-zIK79U3As6ar9EsRbM1ssIQl1Re1Cs6cBA&oe=67BD1851';
  
  profileData: ProfileData = {
    firstname: 'Chaima',
    lastname: 'Zbidi',
    role: 'sheimzab',
    pronouns: 'she/her',
    bio: 'Aspiring digital explorer, I am charting my path in the world of web and mobile development. Always seeking stimulating challenges and innovation.',
    location: 'Monastir, Tunisia',
    github: 'github.com/sheimzab',
    company: 'wind consulting',
    phone: '97 444 444'
  };

  weeks: ContributionDay[][] = [];
  private originalData: ProfileData;

  constructor(private dialog: MatDialog) {
    this.originalData = { ...this.profileData };
    this.generateContributionData();
  }

  ngOnInit(): void {
  }

  toggleEdit(): void {
    if (this.isEditing) {
      // Save changes
      this.originalData = { ...this.profileData };
    }
    this.isEditing = !this.isEditing;
  }

  cancelEdit(): void {
    this.profileData = { ...this.originalData };
    this.isEditing = false;
  }

  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.profileImage = (e.target?.result as string) || this.profileImage;
      };
      reader.readAsDataURL(file);
    }
  }

  getContributionColor(count: number): string {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 2) return 'bg-purple-200 dark:bg-purple-900';
    if (count <= 5) return 'bg-purple-300 dark:bg-purple-700';
    if (count <= 8) return 'bg-purple-400 dark:bg-purple-500';
    return 'bg-purple-500 dark:bg-purple-300';
  }

  private generateContributionData(): void {
    const today = new Date();
    const weeks: ContributionDay[][] = [];
    
    // Generate 52 weeks of data
    for (let week = 0; week < 52; week++) {
      const weekData: ContributionDay[] = [];
      
      // Generate 7 days for each week
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (week * 7 + day));
        
        weekData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 12) // Random number of contributions (0-11)
        });
      }
      
      weeks.push(weekData);
    }
    
    this.weeks = weeks.reverse();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogSettingsProfielComponent, {
      width: '1050px',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: this.profileData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle any data returned from the dialog
        console.log('Dialog closed with result:', result);
      }
    });
  } 

}
