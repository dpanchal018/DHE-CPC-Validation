import path from 'path';
import type { DropdownFieldConfig } from './my-profile-dropdowns';
import {
  LEGOLAND_PROFILE_FIELDS,
  LEGOLAND_DROPDOWN_OPTION_COUNTS,
  TREX_PROFILE_FIELDS,
  TREX_DROPDOWN_OPTION_COUNTS,
  PHONE_COUNTRY_CODE_OPTION_COUNT,
  type ProfileField,
} from './my-profile-fields';

export type CpcSite = 'LEGOLAND' | 'TREX';
export type CpcLocale = 'EN' | 'AR';

export type CpcSettings = {
  site: CpcSite;
  locale: CpcLocale;
  cpcUrl: string;
  suiteTitle: string;
  sectionHeadings: string[];
  saveButtonName: string;
  dropdownExcelFile: string;
  uaeCountryOfResidence: string;
  dropdownPlaceholderPrefixes: string[];
  dropdownFields: DropdownFieldConfig[];
  profileFields: ProfileField[];
  dropdownOptionCounts: Record<string, number>;
  phoneCountryCodeOptionCount: number;
  languagePreferenceSelector: string;
  /** Validate native required-field messages when Save is clicked on a blank form. */
  blankFormSaveValidation?: boolean;
};

const LEGOLAND_EN_DROPDOWN_FIELDS: DropdownFieldConfig[] = [
  {
    label: 'Title',
    reportKey: 'title',
    excelHeader: 'Title',
    type: 'select',
    selector: 'select[name="profileSalutation"]',
  },
  {
    label: 'Phone Country Code',
    reportKey: 'phone-country-code',
    excelHeader: 'Phone Country Code',
    type: 'datalist',
    selector: '#country-code',
    datalistId: 'codedatalistOptions',
  },
  {
    label: 'Country of Residence',
    reportKey: 'country-of-residence',
    excelHeader: 'Country of Residence',
    type: 'select',
    selector: '#profileCountry',
  },
  {
    label: 'City',
    reportKey: 'city',
    excelHeader: 'City (UAE Residents only)',
    type: 'select',
    selector: '#city',
    requiresCountryOfResidence: 'United Arab Emirates',
  },
  {
    label: 'Nationality',
    reportKey: 'nationality',
    excelHeader: 'Nationality (UAE Residents only)',
    type: 'select',
    selector: '#nationality',
    requiresCountryOfResidence: 'United Arab Emirates',
  },
  {
    label: 'Gender',
    reportKey: 'gender',
    excelHeader: 'Gender',
    type: 'select',
    selector: '#gender',
  },
  {
    label: 'Language Preference',
    reportKey: 'language-preference',
    excelHeader: 'Language Preference',
    type: 'select',
    selector: 'select[name="profilelang"]',
  },
  {
    label: 'Marital Status',
    reportKey: 'marital-status',
    excelHeader: 'Marital Status',
    type: 'select',
    selector: 'select[name="maritalstatus"]',
  },
];

const LEGOLAND_AR_DROPDOWN_FIELDS: DropdownFieldConfig[] = [
  {
    label: 'Title',
    reportKey: 'title',
    excelHeader: 'اللقب (السيد/آنسة/السيدة)',
    type: 'select',
    selector: 'select[name="profileSalutation"]',
  },
  {
    label: 'Phone Country Code',
    reportKey: 'phone-country-code',
    excelHeader: 'Phone Country Code',
    type: 'datalist',
    selector: '#country-code',
    datalistId: 'codedatalistOptions',
  },
  {
    label: 'Country of Residence',
    reportKey: 'country-of-residence',
    excelHeader: 'بلد الإقامة',
    type: 'select',
    selector: '#profileCountry',
  },
  {
    label: 'City',
    reportKey: 'city',
    excelHeader: 'المدينة (المقيمين في دولة الإمارات العربية المتحدة فقط)',
    type: 'select',
    selector: '#city',
    requiresCountryOfResidence: 'الإمارات العربية المتحدة',
  },
  {
    label: 'Nationality',
    reportKey: 'nationality',
    excelHeader: 'الجنسية (المقيمين في دولة الإمارات العربية المتحدة فقط)',
    type: 'select',
    selector: '#nationality',
    requiresCountryOfResidence: 'الإمارات العربية المتحدة',
  },
  {
    label: 'Gender',
    reportKey: 'gender',
    excelHeader: 'الجنس',
    type: 'select',
    selector: '#gender',
  },
  {
    label: 'Language Preference',
    reportKey: 'language-preference',
    excelHeader: 'اللغة المفضلة',
    type: 'select',
    selector: 'select[name="profilelang"]',
  },
  {
    label: 'Marital Status',
    reportKey: 'marital-status',
    excelHeader: 'الحالة الاجتماعية',
    type: 'select',
    selector: 'select[name="maritalstatus"]',
  },
];

const TREX_EN_DROPDOWN_FIELDS: DropdownFieldConfig[] = [
  {
    label: 'Title',
    reportKey: 'title',
    excelHeader: 'Title',
    type: 'select',
    selector: 'select[name="profileSalutation"]',
  },
  {
    label: 'Phone Country Code',
    reportKey: 'phone-country-code',
    excelHeader: 'Phone Country Code',
    type: 'datalist',
    selector: '#country-code',
    datalistId: 'codedatalistOptions',
  },
  {
    label: 'Country of Residence',
    reportKey: 'country-of-residence',
    excelHeader: 'Country of Residence',
    type: 'select',
    selector: '#profileCountry',
  },
  {
    label: 'City',
    reportKey: 'city',
    excelHeader: 'City (UAE Residents only)',
    type: 'select',
    selector: '#city',
    requiresCountryOfResidence: 'United Arab Emirates',
  },
  {
    label: 'Nationality',
    reportKey: 'nationality',
    excelHeader: 'Nationality (UAE Residents only)',
    type: 'select',
    selector: '#nationality',
    requiresCountryOfResidence: 'United Arab Emirates',
  },
  {
    label: 'Gender',
    reportKey: 'gender',
    excelHeader: 'Gender',
    type: 'select',
    selector: '#gender',
  },
  {
    label: 'Language Preference',
    reportKey: 'language-preference',
    excelHeader: 'Language Preference',
    type: 'select',
    selector: 'select[name="profileLang"]',
  },
  {
    label: 'Marital Status',
    reportKey: 'marital-status',
    excelHeader: 'Marital Status',
    type: 'select',
    selector: 'select[name="maritalstatus"]',
  },
];

const CPC_SETTINGS: Record<string, CpcSettings> = {
  LEGOLAND_EN: {
    site: 'LEGOLAND',
    locale: 'EN',
    cpcUrl:
      'https://cloud.explore.legoland.ae/CPC_LL?sfid=MDAzUXMwMDAwMEVBMDNWSUFU#my-profile',
    suiteTitle: 'Legoland CPC - My Profile (EN)',
    sectionHeadings: [
      'Tell us about yourself',
      'Tell us a bit more about your family',
    ],
    saveButtonName: 'Save',
    dropdownExcelFile: path.join(process.cwd(), 'Legoland Dropdown Values.xlsx'),
    uaeCountryOfResidence: 'United Arab Emirates',
    dropdownPlaceholderPrefixes: ['select'],
    dropdownFields: LEGOLAND_EN_DROPDOWN_FIELDS,
    profileFields: LEGOLAND_PROFILE_FIELDS,
    dropdownOptionCounts: LEGOLAND_DROPDOWN_OPTION_COUNTS,
    phoneCountryCodeOptionCount: PHONE_COUNTRY_CODE_OPTION_COUNT,
    languagePreferenceSelector: 'select[name="profilelang"]',
    blankFormSaveValidation: true,
  },
  LEGOLAND_AR: {
    site: 'LEGOLAND',
    locale: 'AR',
    cpcUrl:
      'https://cloud.explore.legoland.ae/CPC_LL_AR?sfid=MDAzUXMwMDAwMEVBMDNWSUFU#my-profile',
    suiteTitle: 'Legoland CPC - My Profile (AR)',
    sectionHeadings: ['أخبرنا عن نفسك', 'أخبرنا المزيد عن عائلتك'],
    saveButtonName: 'حفظ',
    dropdownExcelFile: path.join(
      process.cwd(),
      'Legoland Dropdown Values AR.xlsx',
    ),
    uaeCountryOfResidence: 'الإمارات العربية المتحدة',
    dropdownPlaceholderPrefixes: ['select', 'اختر'],
    dropdownFields: LEGOLAND_AR_DROPDOWN_FIELDS,
    profileFields: LEGOLAND_PROFILE_FIELDS,
    dropdownOptionCounts: LEGOLAND_DROPDOWN_OPTION_COUNTS,
    phoneCountryCodeOptionCount: PHONE_COUNTRY_CODE_OPTION_COUNT,
    languagePreferenceSelector: 'select[name="profilelang"]',
    blankFormSaveValidation: true,
  },
  TREX_EN: {
    site: 'TREX',
    locale: 'EN',
    cpcUrl: 'https://cloud.explore.trexglamping.com/TREX_CPC_QA#my-profile',
    suiteTitle: 'T-Rex Glamping CPC - My Profile (EN)',
    sectionHeadings: [
      'Tell us about yourself',
      'Tell us a bit more about your family',
    ],
    saveButtonName: 'Save',
    dropdownExcelFile: path.join(process.cwd(), 'T-Rex Glamping Dropdown Values.xlsx'),
    uaeCountryOfResidence: 'United Arab Emirates',
    dropdownPlaceholderPrefixes: ['select'],
    dropdownFields: TREX_EN_DROPDOWN_FIELDS,
    profileFields: TREX_PROFILE_FIELDS,
    dropdownOptionCounts: TREX_DROPDOWN_OPTION_COUNTS,
    phoneCountryCodeOptionCount: PHONE_COUNTRY_CODE_OPTION_COUNT,
    languagePreferenceSelector: 'select[name="profileLang"]',
    blankFormSaveValidation: true,
  },
};

export function getCpcSite(): CpcSite {
  const site = process.env.CPC_SITE?.trim().toUpperCase();
  if (site === 'TREX') return 'TREX';
  return 'LEGOLAND';
}

export function getLegolandLocale(): CpcLocale {
  const locale = process.env.LEGOLAND_LOCALE?.trim().toUpperCase();
  if (locale === 'AR') return 'AR';
  if (locale === 'EN') return 'EN';
  if (process.env.LEGOLAND_CPC_URL?.includes('CPC_LL_AR')) return 'AR';
  return 'EN';
}

export function getCpcSettings(): CpcSettings {
  const site = getCpcSite();

  if (site === 'TREX') {
    const settings = CPC_SETTINGS.TREX_EN;
    if (process.env.CPC_URL) {
      return { ...settings, cpcUrl: process.env.CPC_URL };
    }
    return settings;
  }

  const locale = getLegolandLocale();
  const key = locale === 'AR' ? 'LEGOLAND_AR' : 'LEGOLAND_EN';
  const settings = CPC_SETTINGS[key];

  if (process.env.LEGOLAND_CPC_URL) {
    return { ...settings, cpcUrl: process.env.LEGOLAND_CPC_URL };
  }

  return settings;
}

/** @deprecated Use getCpcSettings() */
export function getLocaleSettings(): CpcSettings {
  return getCpcSettings();
}

export type LegolandLocale = CpcLocale;
