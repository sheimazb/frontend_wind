// search-component.component.ts
import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, map, tap } from 'rxjs';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';

interface StackExchangeQuestion {
  question_id: number;
  title: string;
  body: string;
  score: number;
  view_count: number;
  answer_count: number;
  creation_date: number;
  tags: string[];
  owner: {
    display_name: string;
    reputation: number;
    profile_image: string;
  };
  link: string;
}

interface StackExchangeResponse {
  items: StackExchangeQuestion[];
  has_more: boolean;
  quota_max: number;
  quota_remaining: number;
  total?: number;
}

interface SearchCache {
  [key: string]: {
    [page: number]: StackExchangeResponse;
  };
}

@Component({
  selector: 'app-search-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-transparent">
      <!-- Header Section -->
      <div class="bg-transparent border-b border-gray-200 shadow-sm">
        <div class="max-w-6xl mx-auto px-6 py-4">
          <div class="text-center">
            <h1 class="text-3xl font-semibold text-gray-900 mb-2">
              Start your search
            </h1>
            <p class="text-gray-600 text-lg">
              Find programming solutions and technical answers from the community
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-full mx-auto px-6 py-8">
        
        <!-- Search Section -->
        <div class="bg-white rounded-lg shadow-sm border  border-gray-200 p-6 mb-8">
          <div class="relative">
            <div class="relative">
              <input
                [(ngModel)]="searchQuery"
                (input)="onSearchInput($event)"
                (keydown.enter)="performSearch()"
                type="text"
                placeholder="Search for questions, topics, or programming concepts..."
                class="w-full px-4 py-3 pl-12 pr-12 text-base bg-white border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       transition-all duration-200 placeholder-gray-500"
              />
              
              <!-- Search Icon -->
              <div class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Loading Spinner -->
              <div *ngIf="isLoading()" class="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              </div>

              <!-- Clear Button -->
              <button 
                *ngIf="searchQuery && !isLoading()"
                (click)="clearSearch()"
                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 
                       transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                aria-label="Clear search"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Search Options -->
          <div class="mt-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <select 
                [(ngModel)]="pageSize" 
                (change)="onPageSizeChange()"
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="30">30 per page</option>
                <option value="50">50 per page</option>
              </select>
              
              <select 
                [(ngModel)]="sortOption" 
                (change)="onSortChange()"
                class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Most Relevant</option>
                <option value="votes">Most Votes</option>
                <option value="creation">Newest</option>
                <option value="activity">Recent Activity</option>
              </select>
            </div>

            <!-- API Quota Info -->
            <div *ngIf="quotaInfo()" class="text-xs text-gray-500">
              API Quota: {{ quotaInfo()?.remaining }}/{{ quotaInfo()?.max }}
            </div>
          </div>
        </div>

        <!-- Results Header with Pagination Info -->
        <div *ngIf="results().length > 0" class="mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Search Results</h2>
              <p class="text-sm text-gray-600 mt-1">
                Showing {{ startIndex() }}-{{ endIndex() }} of {{ totalResults() }} results
                <span *ngIf="searchTime()" class="ml-2">({{ searchTime() }}ms)</span>
              </p>
            </div>
            
            <!-- Results per page info -->
            <span class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
          </div>
        </div>

        <!-- Search Results -->
        <div *ngIf="results().length > 0" class="space-y-6 mb-8">
          <div 
            *ngFor="let question of results(); trackBy: trackByQuestionId; let i = index"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md 
                   transition-shadow duration-200 cursor-pointer group"
            (click)="openQuestion(question.link)"
            [style.animation-delay.ms]="i * 100"
          >
            <!-- Question Header -->
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 
                         transition-colors duration-200 line-clamp-2">
                {{ question.title }}
              </h3>
              
              <!-- Question Stats Row -->
              <div class="flex items-center space-x-6 text-sm text-gray-600">
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span class="font-medium">{{ question.score }}</span>
                  <span>{{ question.score === 1 ? 'vote' : 'votes' }}</span>
                </div>
                
                <div class="flex items-center space-x-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.002 8.002 0 01-7.419-5M3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"/>
                  </svg>
                  <span>{{ question.answer_count }}</span>
                  <span>{{ question.answer_count === 1 ? 'answer' : 'answers' }}</span>
                </div>
                
                <div class="flex items-center space-x-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <span>{{ formatNumber(question.view_count) }} views</span>
                </div>
                
                <div class="flex items-center space-x-1">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{{ formatDate(question.creation_date) }}</span>
                </div>
              </div>
            </div>

            <!-- Tags Section -->
            <div class="mb-4" *ngIf="question.tags && question.tags.length > 0">
              <div class="flex flex-wrap gap-2">
                <span 
                  *ngFor="let tag of question.tags.slice(0, 5)" 
                  class="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs 
                         font-medium hover:bg-blue-100 transition-colors duration-200"
                >
                  {{ tag }}
                </span>
                <span 
                  *ngIf="question.tags.length > 5"
                  class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                >
                  +{{ question.tags.length - 5 }} more
                </span>
              </div>
            </div>

            <!-- Author and Action Section -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
              <div class="flex items-center space-x-3">
                <img 
                  [src]="question.owner.profile_image || 'https://via.placeholder.com/32'" 
                  [alt]="question.owner.display_name"
                  class="w-8 h-8 rounded-full border-2 border-gray-200"
                  loading="lazy"
                  onerror="this.src='https://via.placeholder.com/32'"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ question.owner.display_name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatNumber(question.owner.reputation) }} reputation
                  </p>
                </div>
              </div>
              
              <div class="flex items-center text-blue-600 group-hover:text-blue-700">
                <span class="text-sm font-medium mr-1">View Question</span>
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div *ngIf="results().length > 0 && totalPages() > 1" 
             class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <!-- Previous Button -->
            <button 
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1 || isLoading()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Previous
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center space-x-2">
              <button 
                *ngFor="let page of visiblePages()"
                (click)="goToPage(page)"
                [disabled]="isLoading()"
                [class]="page === currentPage() 
                  ? 'px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg'
                  : 'px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200'"
              >
                {{ page }}
              </button>
            </div>

            <!-- Next Button -->
            <button 
              (click)="goToPage(currentPage() + 1)"
              [disabled]="!hasMore() || isLoading()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
              <svg class="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Page Jump -->
          <div class="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600">
            <span>Jump to page:</span>
            <input 
              type="number" 
              [value]="currentPage()"
              (keydown.enter)="jumpToPage($event)"
              [min]="1" 
              [max]="totalPages()"
              class="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>of {{ totalPages() }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="searchQuery && results().length === 0 && !isLoading()" 
             class="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.54-1.006-6.02-2.709M15 11V9a6 6 0 00-12 0v2a6 6 0 006-6z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p class="text-gray-600 max-w-md mx-auto">
            We couldn't find any questions matching your search. Try using different keywords or check your spelling.
          </p>
          <button 
            (click)="clearSearch()"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors duration-200 font-medium"
          >
            Clear Search
          </button>
        </div>

        <!-- Initial State -->
        <div *ngIf="!searchQuery" class="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="text-gray-400 mb-6">
            <svg class="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="flex flex-col items-center justify-center">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Search Stack Exchange</h3>
          <p class="text-gray-600 text-base max-w-lg mx-auto mb-6">
            Enter your programming questions or topics to find relevant discussions and solutions 
            from the Stack Exchange community.
          </p>
          </div>
          <div class="flex flex-wrap justify-center gap-2 text-sm">
            <button 
              *ngFor="let tag of popularTags"
              (click)="searchTag(tag)"
              class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    /* Ensure consistent hover states */
    .group:hover .group-hover\\:text-blue-600 {
      color: #2563eb;
    }
    
    .group:hover .group-hover\\:text-blue-700 {
      color: #1d4ed8;
    }
    
    .group:hover .group-hover\\:translate-x-1 {
      transform: translateX(0.25rem);
    }
    
    /* Custom scrollbar for better aesthetics */
    ::-webkit-scrollbar {
      width: 6px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Animation for results */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .bg-white:hover {
      animation: none;
    }
  `]
})
export class SearchComponentComponent {
  private http = inject(HttpClient);
  private searchSubject = new Subject<string>();
  private pageSubject = new BehaviorSubject<number>(1);
  private cache: SearchCache = {};
  
  searchQuery = '';
  currentPage = signal(1);
  pageSize = 20;
  sortOption = 'relevance';
  results = signal<StackExchangeQuestion[]>([]);
  isLoading = signal(false);
  hasMore = signal(false);
  quotaInfo = signal<{max: number, remaining: number} | null>(null);
  searchTime = signal<number | null>(null);
  totalResults = signal(0);
  
  popularTags = ['JavaScript', 'Python', 'React', 'Angular', 'Node.js', 'TypeScript', 'CSS', 'HTML'];

  // Computed properties
  totalPages = computed(() => Math.ceil(this.totalResults() / this.pageSize));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  endIndex = computed(() => Math.min(this.currentPage() * this.pageSize, this.totalResults()));

  constructor() {
    // Combine search query and page changes
    combineLatest([
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.pageSubject.pipe(distinctUntilChanged())
    ]).pipe(
      switchMap(([query, page]) => {
        if (!query.trim()) {
          this.isLoading.set(false);
          this.results.set([]);
          this.totalResults.set(0);
          return of(null);
        }
        
        // Check cache first
        const cacheKey = `${query}-${this.sortOption}-${this.pageSize}`;
        if (this.cache[cacheKey] && this.cache[cacheKey][page]) {
          const cachedResult = this.cache[cacheKey][page];
          this.results.set(cachedResult.items || []);
          this.hasMore.set(cachedResult.has_more);
          this.quotaInfo.set({
            max: cachedResult.quota_max,
            remaining: cachedResult.quota_remaining
          });
          return of(null);
        }
        
        this.isLoading.set(true);
        const startTime = performance.now();
        
        return this.searchStackExchange(query, page).pipe(
          tap(response => {
            const endTime = performance.now();
            this.searchTime.set(Math.round(endTime - startTime));
            
            // Cache the result
            if (!this.cache[cacheKey]) {
              this.cache[cacheKey] = {};
            }
            this.cache[cacheKey][page] = response;
            
            // Estimate total results (API doesn't provide exact count)
            const estimatedTotal = page === 1 ? 
              (response.has_more ? this.pageSize * 10 : response.items.length) :
              this.totalResults();
            
            this.totalResults.set(estimatedTotal);
          }),
          catchError(error => {
            console.error('Search error:', error);
            this.isLoading.set(false);
            return of({
              items: [],
              has_more: false,
              quota_max: 0,
              quota_remaining: 0
            });
          })
        );
      })
    ).subscribe(response => {
      if (response) {
        this.results.set(response.items || []);
        this.hasMore.set(response.has_more);
        this.quotaInfo.set({
          max: response.quota_max,
          remaining: response.quota_remaining
        });
      }
      this.isLoading.set(false);
    });
  }

  onSearchInput(event: any) {
    const query = event.target.value || '';
    this.searchQuery = query;
    this.currentPage.set(1);
    this.pageSubject.next(1);
    this.searchSubject.next(query);
  }

  performSearch() {
    if (this.searchQuery.trim()) {
      this.currentPage.set(1);
      this.pageSubject.next(1);
      this.searchSubject.next(this.searchQuery);
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.results.set([]);
    this.currentPage.set(1);
    this.totalResults.set(0);
    this.searchTime.set(null);
    this.searchSubject.next('');
  }

  searchTag(tag: string) {
    this.searchQuery = tag;
    this.performSearch();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages() && !this.isLoading()) {
      this.currentPage.set(page);
      this.pageSubject.next(page);
      
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  jumpToPage(event: any) {
    const page = parseInt(event.target.value);
    if (page && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
  }

  onPageSizeChange() {
    this.cache = {}; // Clear cache when page size changes
    this.currentPage.set(1);
    this.pageSubject.next(1);
    if (this.searchQuery.trim()) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  onSortChange() {
    this.cache = {}; // Clear cache when sort changes
    this.currentPage.set(1);
    this.pageSubject.next(1);
    if (this.searchQuery.trim()) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  visiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const delta = 2; // Number of pages to show on each side
    
    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);
    
    // Adjust if we're near the beginning or end
    if (current <= delta + 1) {
      end = Math.min(total, 2 * delta + 1);
    }
    if (current >= total - delta) {
      start = Math.max(1, total - 2 * delta);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  private searchStackExchange(query: string, page: number = 1) {
    const apiUrl = 'https://api.stackexchange.com/2.3/search/advanced';
    
    const encodedQuery = encodeURIComponent(query.trim());
    
    const params = {
      order: 'desc',
      sort: this.sortOption,
      q: encodedQuery,
      site: 'stackoverflow',
      page: page.toString(),
      pagesize: this.pageSize.toString(),
      key: 'rl_tNEemF6znuYTzNM1kffPcrPqs',
      filter: '!9Z(-wwYGT' // Optimized filter for essential fields only
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return this.http.get<StackExchangeResponse>(`${apiUrl}?${queryString}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip'
      },
      observe: 'response'
    }).pipe(
      map(response => response.body || { items: [], has_more: false, quota_max: 0, quota_remaining: 0 }),
      catchError(error => {
        console.error('Search error:', {
          status: error.status,
          message: error.message
        });
        return of({
          items: [],
          has_more: false,
          quota_max: 0,
          quota_remaining: 0
        });
      })
    );
  }

  openQuestion(link: string) {
    window.open(link, '_blank');
  }
  trackByQuestionId(index: number, question: StackExchangeQuestion): number {
    return question.question_id;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }
}