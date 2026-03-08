export const formatViews = (count) => {
    if (count < 2) return count.toString();

    if (count < 1000) return count.toString();

    if (count < 1_000_000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }

    if (count < 1_000_000_000) {
        return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }

    return (count / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
}

export const formatDuration = (seconds)=>{
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const hh = h > 0 ? String(h).padStart(2, "0") + ":" : "";
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");

    return hh + mm + ":" + ss;
}

export const formatDate = (dateString, langCode) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return `Le ${date.toLocaleDateString(langCode, options)}`;
};


export const formatRelativeTime = (dateInput, lang = 'fr') => {
  if (!dateInput) return 'Date inconnue';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  const translations = {
    fr: {
      now: 'À l\'instant',
      seconds: 'seconde',
      seconds_plural: 'secondes',
      minute: 'minute',
      minutes_plural: 'minutes',
      hour: 'heure',
      hours_plural: 'heures',
      day: 'jour',
      days_plural: 'jours',
      week: 'semaine',
      weeks_plural: 'semaines',
      month: 'mois',
      months_plural: 'mois',
      year: 'an',
      years_plural: 'ans',
      prefix: 'il y a',
      suffix: ''
    },
    en: {
      now: 'Just now',
      seconds: 'second',
      seconds_plural: 'seconds',
      minute: 'minute',
      minutes_plural: 'minutes',
      hour: 'hour',
      hours_plural: 'hours',
      day: 'day',
      days_plural: 'days',
      week: 'week',
      weeks_plural: 'weeks',
      month: 'month',
      months_plural: 'months',
      year: 'year',
      years_plural: 'years',
      prefix: '',
      suffix: 'ago'
    }
  };

  const t = translations[lang] || translations.fr;

  // Moins d'une minute
  if (diffInSeconds < 60) {
    if (diffInSeconds < 10) return t.now;
    return `${t.prefix} ${diffInSeconds} ${diffInSeconds === 1 ? t.seconds : t.seconds_plural} ${t.suffix}`.trim();
  }

  // Moins d'une heure
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return `${t.prefix} 1 ${t.minute} ${t.suffix}`.trim();
    return `${t.prefix} ${diffInMinutes} ${t.minutes_plural} ${t.suffix}`.trim();
  }

  // Moins d'un jour
  if (diffInHours < 24) {
    if (diffInHours === 1) return `${t.prefix} 1 ${t.hour} ${t.suffix}`.trim();
    return `${t.prefix} ${diffInHours} ${t.hours_plural} ${t.suffix}`.trim();
  }

  // Moins d'une semaine
  if (diffInDays < 7) {
    if (diffInDays === 1) return `${t.prefix} 1 ${t.day} ${t.suffix}`.trim();
    return `${t.prefix} ${diffInDays} ${t.days_plural} ${t.suffix}`.trim();
  }

  // Moins d'un mois
  if (diffInWeeks < 4) {
    if (diffInWeeks === 1) return `${t.prefix} 1 ${t.week} ${t.suffix}`.trim();
    return `${t.prefix} ${diffInWeeks} ${t.weeks_plural} ${t.suffix}`.trim();
  }

  // Moins d'un an
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return `${t.prefix} 1 ${t.month} ${t.suffix}`.trim();
    return `${t.prefix} ${diffInMonths} ${t.months_plural} ${t.suffix}`.trim();
  }

  // Plus d'un an
  if (diffInYears === 1) return `${t.prefix} 1 ${t.year} ${t.suffix}`.trim();
  return `${t.prefix} ${diffInYears} ${t.years_plural} ${t.suffix}`.trim();
};