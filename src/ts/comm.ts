import { Properties } from '@/store/dbconfig_mapping';
export function date_trans(date: string) {
  // YYYYMMDD=>YYYY/MM/DD
  const reg = /(\d{4})(\d{2})(\d{2})/;
  return date.replace(reg, '$1/$2/$3');
}

export function time_trans(date: string) {
  // HHmmss =>HH:MM:SS
  const reg = /(\d{2})(\d{2})(\d{2})/;
  return date.replace(reg, '$1:$2:$3');
}

export function date_time_trans_replaceZ(date: string) {
  // YYYYMMDDHHmmssZ => YYYY/MM/DD HH:mm:ss
  const reg = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\w{1})/;
  return date.replace(reg, '$1/$2/$3 $4:$5:$6');
}

export function Have_Full_Width(date: string) {
  // 黑名單 有全形字元返回true
  const data_length = date.match(/[\uff00-\uffff]/g) || 0;
  if (data_length == 0) {
    return false;
  }
  else {
    alert('不可輸入全形字元');
    return true;
  }

}

export function Have_CH(date: string) {
  // 黑名單 有中文返回true
  const data_length = date.match(/[\u4e00-\u9fa5]/g) || 0;
  if (data_length == 0) {
    return false;
  }
  else {
    alert('不可輸入中文');
    return true;
  }

}

export function date_check_year(date: string) {
  let check_result = false;
  if (9999 >= parseInt(date.split('-')[0]) && parseInt(date.split('-')[0]) > 1900) {
    check_result = true;
  }
  return check_result;

}

export function date_check_comparator(date1: string, date2: string) {
  //date2 must > date1
  let check_result = false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (d2 >= d1) {
    check_result = true;
  }
  return check_result;

}

export function DateDiff(Date1:Date, Date2:Date) { // Date type = yyyy-mm-dd
  const diff = Date1.valueOf() - Date2.valueOf();
  return (diff / 1000 / 60 / 60 / 24); // 1000 毫秒 60秒 60分 24小時  =天
}

export function res4Mapping(res4:string){
  switch (res4) {
    case '0':
      return '董事長';
    case '1':
      return '總經理';
    case '2':
      return '副總經理';
    case '3':
      return '區處級主管';
    case '4':
      return '區處級副主管';
    case '5':
      return '分行經理';
    case '6':
      return '部經理(總行單位)';
    case '7':
      return '區部副理(總行單位)';
    case '8':
      return '分行副理';
    case '9':
      return '非主管(經辦)';
    case 'A':
      return '董監事';
    case 'C':
      return '分行資深副理';
    default :
      return res4;
  }
}

export function comparproperties(properties1: Properties, properties2: Properties) {
  if (parseInt(properties1.YearE) < parseInt(properties2.YearE)) {
    return 1;
  }
  if (parseInt(properties1.YearE) > parseInt(properties2.YearE)) {
    return -1;
  }
  return 0;
}


