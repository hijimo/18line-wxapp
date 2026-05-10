export interface Preference {
  preferenceId?: number;
  touristId?: number;
  tripId?: number;
  gender?: string;
  birthYear?: number;
  stamina?: string;
  staminaLabel?: string;
  travelLikes?: string;
  travelLikesList?: Record<string, string>[];
  foodLikes?: string;
  foodLikesList?: Record<string, string>[];
  stayPref?: string;
  stayPrefList?: Record<string, string>[];
  healthTags?: string;
  healthTagsList?: Record<string, string>[];
  blindMode?: string;
  blindModeLabel?: string;
  status?: string;
  delFlag?: string;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
  remark?: string;
}

export type PreferenceParams = Omit<Preference, 'preferenceId'> & {
  preferenceId?: number;
};
