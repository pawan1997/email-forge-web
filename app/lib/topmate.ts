import { TopmateProfile, TopmateService, TopmateBadge } from '../types/poster';

const TOPMATE_API_BASE = 'https://d2ntssqgwvof3c.cloudfront.net/fetchByUsername';

interface TopmateAPIResponse {
  user_id?: string;
  id?: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  name?: string;
  profile_pic?: string;
  picture?: string;
  bio?: string;
  description?: string;
  linkedin_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  timezone?: string;

  // Metrics
  total_bookings?: number;
  bookings_count?: number;
  total_reviews?: number;
  reviews_count?: number;
  total_ratings?: number;
  ratings_count?: number;
  average_rating?: number;
  rating?: number;
  expertise_count?: number;
  expertise?: string;
  expertise_category?: string;

  // Services array
  services?: Array<{
    id: string;
    title: string;
    description?: string;
    type?: number;
    duration?: number;
    charge?: {
      amount?: number;
      currency?: string;
    };
    booking_count?: number;
    promised_response_time?: string;
  }>;

  // Badges
  badges?: Array<{
    id: string;
    name: string;
    description?: string;
    image_url?: string;
  }>;

  // Liked properties
  liked_properties?: {
    friendly?: number;
    helpful?: number;
    insightful?: number;
  };

  testimonials_count?: number;
  ai_testimonial_summary?: string;
  meta_image?: string;
  join_date?: string;
  created_at?: string;
}

export async function fetchTopmateProfile(username: string): Promise<TopmateProfile> {
  const url = `${TOPMATE_API_BASE}/?username=${encodeURIComponent(username)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Topmate profile: ${response.status} ${response.statusText}`);
  }

  const data: TopmateAPIResponse = await response.json();

  // Transform API response to our normalized TopmateProfile type
  const profile: TopmateProfile = {
    user_id: data.user_id || data.id || '',
    username: data.username,
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    display_name: data.display_name || data.name || `${data.first_name} ${data.last_name}`.trim(),
    profile_pic: data.profile_pic || data.picture || '',
    bio: data.bio || data.description || '',
    description: data.description,
    linkedin_url: data.linkedin_url,
    instagram_url: data.instagram_url,
    twitter_url: data.twitter_url,
    timezone: data.timezone || 'UTC',

    // Metrics - handle various field names
    total_bookings: data.total_bookings || data.bookings_count || 0,
    total_reviews: data.total_reviews || data.reviews_count || 0,
    total_ratings: data.total_ratings || data.ratings_count || 0,
    average_rating: data.average_rating || data.rating || 0,
    expertise_count: data.expertise_count || 0,
    expertise_category: data.expertise_category || data.expertise,

    // Services
    services: (data.services || []).map((s): TopmateService => ({
      id: s.id,
      title: s.title,
      description: s.description || '',
      type: s.type || 1,
      duration: s.duration || 30,
      charge: {
        amount: s.charge?.amount || 0,
        currency: s.charge?.currency || 'INR',
      },
      booking_count: s.booking_count || 0,
      promised_response_time: s.promised_response_time,
    })),

    // Badges
    badges: (data.badges || []).map((b): TopmateBadge => ({
      id: b.id,
      name: b.name,
      description: b.description,
      image_url: b.image_url,
    })),

    // Liked properties
    liked_properties: data.liked_properties ? {
      friendly: data.liked_properties.friendly || 0,
      helpful: data.liked_properties.helpful || 0,
      insightful: data.liked_properties.insightful || 0,
    } : undefined,

    testimonials_count: data.testimonials_count || 0,
    ai_testimonial_summary: data.ai_testimonial_summary,
    meta_image: data.meta_image,
    join_date: data.join_date || data.created_at,
  };

  return profile;
}

// Helper to format profile data for AI prompt context
export function formatProfileForPrompt(profile: TopmateProfile): string {
  const lines: string[] = [
    `## Creator Profile: ${profile.display_name}`,
    `Username: @${profile.username}`,
    `Bio: ${profile.bio}`,
    '',
    `## Stats & Credibility`,
    `- Total Bookings: ${profile.total_bookings.toLocaleString()}`,
    `- Reviews: ${profile.total_reviews} (${profile.average_rating}/5 avg rating)`,
    `- Testimonials: ${profile.testimonials_count}`,
  ];

  if (profile.liked_properties) {
    lines.push(
      `- Described as: Friendly (${profile.liked_properties.friendly}), Helpful (${profile.liked_properties.helpful}), Insightful (${profile.liked_properties.insightful})`
    );
  }

  if (profile.badges.length > 0) {
    lines.push('', '## Badges & Recognition');
    profile.badges.forEach(badge => {
      lines.push(`- ${badge.name}${badge.description ? `: ${badge.description}` : ''}`);
    });
  }

  if (profile.services.length > 0) {
    lines.push('', '## Services Offered');
    profile.services.slice(0, 5).forEach(service => {
      const price = service.charge.amount > 0
        ? `${service.charge.currency} ${service.charge.amount}`
        : 'Free';
      lines.push(`- ${service.title} (${service.duration}min, ${price}) - ${service.booking_count} bookings`);
    });
    if (profile.services.length > 5) {
      lines.push(`  ...and ${profile.services.length - 5} more services`);
    }
  }

  if (profile.ai_testimonial_summary) {
    lines.push('', '## What People Say', profile.ai_testimonial_summary);
  }

  if (profile.linkedin_url || profile.instagram_url || profile.twitter_url) {
    lines.push('', '## Social Links');
    if (profile.linkedin_url) lines.push(`- LinkedIn: ${profile.linkedin_url}`);
    if (profile.instagram_url) lines.push(`- Instagram: ${profile.instagram_url}`);
    if (profile.twitter_url) lines.push(`- Twitter: ${profile.twitter_url}`);
  }

  return lines.join('\n');
}

// Get top services by booking count
export function getTopServices(profile: TopmateProfile, limit = 3): TopmateService[] {
  return [...profile.services]
    .sort((a, b) => b.booking_count - a.booking_count)
    .slice(0, limit);
}

// Calculate social proof score (for visual emphasis)
export function calculateSocialProof(profile: TopmateProfile): {
  score: number;
  level: 'starter' | 'growing' | 'established' | 'expert' | 'legend';
} {
  let score = 0;

  // Bookings weight
  score += Math.min(profile.total_bookings / 100, 30);

  // Reviews weight
  score += Math.min(profile.total_reviews / 10, 20);

  // Rating weight (only if has reviews)
  if (profile.total_reviews > 0) {
    score += (profile.average_rating / 5) * 20;
  }

  // Badges weight
  score += Math.min(profile.badges.length * 2, 20);

  // Testimonials weight
  score += Math.min(profile.testimonials_count / 10, 10);

  // Determine level
  let level: 'starter' | 'growing' | 'established' | 'expert' | 'legend';
  if (score >= 80) level = 'legend';
  else if (score >= 60) level = 'expert';
  else if (score >= 40) level = 'established';
  else if (score >= 20) level = 'growing';
  else level = 'starter';

  return { score: Math.round(score), level };
}
