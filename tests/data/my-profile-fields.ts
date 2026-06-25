export type ProfileField = {
  label: string;
  selector: string;
  fieldType: 'dropdown' | 'text' | 'email' | 'phone' | 'date' | 'radio' | 'datalist';
  required?: boolean;
  visible?: boolean;
};

export const MY_PROFILE_SECTION_HEADINGS = [
  'Tell us about yourself',
  'Tell us a bit more about your family',
];

export const LAST_NAME_SELECTOR = 'input[name="lastName"]';

const BASE_PROFILE_FIELDS: ProfileField[] = [
  {
    label: 'Title (Mr./Ms./Mrs.)',
    selector: 'select[name="profileSalutation"]',
    fieldType: 'dropdown',
  },
  {
    label: 'First Name',
    selector: '#firstName',
    fieldType: 'text',
    required: true,
  },
  {
    label: 'Last Name',
    selector: LAST_NAME_SELECTOR,
    fieldType: 'text',
    required: true,
  },
  {
    label: 'Email Address',
    selector: '#email',
    fieldType: 'email',
    required: true,
  },
  {
    label: 'Phone Country Code',
    selector: '#country-code',
    fieldType: 'datalist',
    required: true,
  },
  {
    label: 'Phone',
    selector: '#phone1',
    fieldType: 'phone',
    required: true,
  },
  {
    label: 'Country of Residence',
    selector: '#profileCountry',
    fieldType: 'dropdown',
    required: true,
  },
  {
    label: 'City (UAE Residents only)',
    selector: '#city',
    fieldType: 'dropdown',
  },
  {
    label: 'Nationality (UAE Residents only)',
    selector: '#nationality',
    fieldType: 'dropdown',
  },
  {
    label: 'Gender',
    selector: '#gender',
    fieldType: 'dropdown',
  },
  {
    label: 'Birthday',
    selector: '#birthday',
    fieldType: 'date',
  },
  {
    label: 'Marital Status',
    selector: 'select[name="maritalstatus"]',
    fieldType: 'dropdown',
  },
  {
    label: 'Do you have Children? (Yes)',
    selector: '#kids',
    fieldType: 'radio',
  },
  {
    label: 'Do you have Children? (No)',
    selector: '#nokids',
    fieldType: 'radio',
  },
  {
    label: 'Number of Children',
    selector: '#numOfKids',
    fieldType: 'dropdown',
    visible: false,
  },
];

export const LEGOLAND_PROFILE_FIELDS: ProfileField[] = [
  ...BASE_PROFILE_FIELDS.slice(0, 11),
  {
    label: 'Language Preference',
    selector: 'select[name="profilelang"]',
    fieldType: 'dropdown',
  },
  ...BASE_PROFILE_FIELDS.slice(11),
];

export const TREX_PROFILE_FIELDS: ProfileField[] = [
  ...BASE_PROFILE_FIELDS.slice(0, 11),
  {
    label: 'Language Preference',
    selector: 'select[name="profileLang"]',
    fieldType: 'dropdown',
  },
  ...BASE_PROFILE_FIELDS.slice(11),
];

/** @deprecated Use LEGOLAND_PROFILE_FIELDS or getCpcSettings().profileFields */
export const MY_PROFILE_FIELDS = LEGOLAND_PROFILE_FIELDS;

const SHARED_DROPDOWN_OPTION_COUNTS: Record<string, number> = {
  'select[name="profileSalutation"]': 4,
  '#profileCountry': 259,
  '#city': 8,
  '#nationality': 259,
  '#gender': 3,
  'select[name="maritalstatus"]': 3,
  '#numOfKids': 11,
};

export const LEGOLAND_DROPDOWN_OPTION_COUNTS: Record<string, number> = {
  ...SHARED_DROPDOWN_OPTION_COUNTS,
  'select[name="profilelang"]': 3,
};

export const TREX_DROPDOWN_OPTION_COUNTS: Record<string, number> = {
  ...SHARED_DROPDOWN_OPTION_COUNTS,
  'select[name="profileLang"]': 8,
};

/** @deprecated Use getCpcSettings().dropdownOptionCounts */
export const MY_PROFILE_DROPDOWN_OPTION_COUNTS = LEGOLAND_DROPDOWN_OPTION_COUNTS;

export const PHONE_COUNTRY_CODE_OPTION_COUNT = 244;
