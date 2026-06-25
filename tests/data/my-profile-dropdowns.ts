export type DropdownFieldConfig = {
  label: string;
  reportKey: string;
  excelHeader: string;
  type: 'select' | 'datalist';
  selector: string;
  datalistId?: string;
  /** Select this country before validating dependent dropdowns (City, Nationality). */
  requiresCountryOfResidence?: string;
};
