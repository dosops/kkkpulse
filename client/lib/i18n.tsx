import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'ru';

const translations = {
  en: {
    tabs: {
      alerts: 'Alerts',
      incidents: 'Incidents',
      status: 'Status',
      activity: 'Activity',
      profile: 'Profile',
    },
    alerts: {
      title: 'Alerts',
      new: 'New',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      all: 'All',
      noAlerts: 'No alerts',
      source: {
        manual: 'Manual',
        system: 'System',
      },
      status: {
        newNotReviewed: 'New - not reviewed',
        inProgressBy: 'In progress:',
        incidentRegisteredBy: 'Incident registered by',
      },
      actions: {
        takeToWork: 'Take to Work',
        inspect: 'Inspect',
        registerIncident: 'Register Incident',
      },
      detail: {
        description: 'Description',
        details: 'Details',
        metadata: 'Metadata',
        history: 'History',
        takenToWork: 'Taken to work',
        inspected: 'Inspected',
        incidentRegistered: 'Incident registered',
      },
    },
    incidents: {
      title: 'Incidents',
      open: 'Open',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      all: 'All',
      noIncidents: 'No incidents',
      priority: 'Priority',
      assignee: 'Assignee',
      category: 'Category',
      notes: 'Notes',
      customFields: 'Custom Fields',
      close: 'Close Incident',
      closeModal: {
        title: 'Close Incident',
        startTime: 'Start Time',
        endTime: 'End Time',
        consequences: 'Consequences / Impact',
        consequencesPlaceholder: 'Describe the impact and consequences...',
        cancel: 'Cancel',
        confirm: 'Close Incident',
      },
      categories: {
        hardware: 'Hardware',
        software: 'Software',
        network: 'Network',
        security: 'Security',
        other: 'Other',
      },
    },
    status: {
      title: 'System Status',
      availability: 'Availability',
      uptime: 'Uptime',
      totalDowntime: 'Total Downtime',
      totalIncidents: 'Total Incidents',
      openIncidents: 'Open Incidents',
      resolvedIncidents: 'Resolved Incidents',
      last30Days: 'Last 30 days',
      noDowntime: 'No downtime recorded',
      hours: 'h',
      minutes: 'm',
      operational: 'Operational',
      degraded: 'Degraded Performance',
      majorOutage: 'Major Outage',
    },
    activity: {
      title: 'Activity',
      noActivity: 'No activity',
      types: {
        alertCreated: 'created alert',
        alertTaken: 'took alert to work',
        alertInspected: 'inspected alert',
        incidentRegistered: 'registered incident',
        incidentUpdated: 'updated incident',
        incidentClosed: 'closed incident',
      },
    },
    profile: {
      title: 'Profile',
      language: 'Language',
      statistics: 'Statistics',
      alertsHandled: 'Alerts Handled',
      incidentsResolved: 'Incidents Resolved',
      settings: 'Settings',
    },
    create: {
      alert: {
        title: 'Create Alert',
        titleField: 'Title',
        titlePlaceholder: 'Enter alert title',
        description: 'Description',
        descriptionPlaceholder: 'Describe the issue...',
        severity: 'Severity',
        addImage: 'Add Image',
        submit: 'Create Alert',
      },
      incident: {
        title: 'Register Incident',
        titleField: 'Incident Title',
        description: 'Description',
        severity: 'Severity',
        priority: 'Priority',
        category: 'Category',
        notes: 'Notes',
        notesPlaceholder: 'Add notes...',
        submit: 'Register Incident',
      },
    },
    common: {
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
    },
    severity: {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    fab: {
      createAlert: 'Create Alert',
      registerIncident: 'Register Incident',
    },
  },
  ru: {
    tabs: {
      alerts: 'Алерты',
      incidents: 'Инциденты',
      status: 'Статус',
      activity: 'Активность',
      profile: 'Профиль',
    },
    alerts: {
      title: 'Алерты',
      new: 'Новые',
      inProgress: 'В работе',
      resolved: 'Решено',
      all: 'Все',
      noAlerts: 'Нет алертов',
      source: {
        manual: 'Ручной',
        system: 'Система',
      },
      status: {
        newNotReviewed: 'Новый - не просмотрен',
        inProgressBy: 'В работе:',
        incidentRegisteredBy: 'Инцидент зарегистрирован',
      },
      actions: {
        takeToWork: 'Взять в работу',
        inspect: 'Осмотреть',
        registerIncident: 'Зарегистрировать инцидент',
      },
      detail: {
        description: 'Описание',
        details: 'Детали',
        metadata: 'Метаданные',
        history: 'История',
        takenToWork: 'Взято в работу',
        inspected: 'Осмотрено',
        incidentRegistered: 'Инцидент зарегистрирован',
      },
    },
    incidents: {
      title: 'Инциденты',
      open: 'Открыт',
      inProgress: 'В работе',
      resolved: 'Решен',
      closed: 'Закрыт',
      all: 'Все',
      noIncidents: 'Нет инцидентов',
      priority: 'Приоритет',
      assignee: 'Исполнитель',
      category: 'Категория',
      notes: 'Заметки',
      customFields: 'Доп. поля',
      close: 'Закрыть инцидент',
      closeModal: {
        title: 'Закрытие инцидента',
        startTime: 'Время начала',
        endTime: 'Время окончания',
        consequences: 'Последствия / Влияние',
        consequencesPlaceholder: 'Опишите последствия и влияние...',
        cancel: 'Отмена',
        confirm: 'Закрыть инцидент',
      },
      categories: {
        hardware: 'Оборудование',
        software: 'Программное обеспечение',
        network: 'Сеть',
        security: 'Безопасность',
        other: 'Другое',
      },
    },
    status: {
      title: 'Статус системы',
      availability: 'Доступность',
      uptime: 'Аптайм',
      totalDowntime: 'Общий простой',
      totalIncidents: 'Всего инцидентов',
      openIncidents: 'Открытых инцидентов',
      resolvedIncidents: 'Решенных инцидентов',
      last30Days: 'За последние 30 дней',
      noDowntime: 'Простоев не зафиксировано',
      hours: 'ч',
      minutes: 'м',
      operational: 'Работает',
      degraded: 'Снижение производительности',
      majorOutage: 'Серьезный сбой',
    },
    activity: {
      title: 'Активность',
      noActivity: 'Нет активности',
      types: {
        alertCreated: 'создал алерт',
        alertTaken: 'взял алерт в работу',
        alertInspected: 'осмотрел алерт',
        incidentRegistered: 'зарегистрировал инцидент',
        incidentUpdated: 'обновил инцидент',
        incidentClosed: 'закрыл инцидент',
      },
    },
    profile: {
      title: 'Профиль',
      language: 'Язык',
      statistics: 'Статистика',
      alertsHandled: 'Обработано алертов',
      incidentsResolved: 'Решено инцидентов',
      settings: 'Настройки',
    },
    create: {
      alert: {
        title: 'Создать алерт',
        titleField: 'Заголовок',
        titlePlaceholder: 'Введите заголовок алерта',
        description: 'Описание',
        descriptionPlaceholder: 'Опишите проблему...',
        severity: 'Критичность',
        addImage: 'Добавить изображение',
        submit: 'Создать алерт',
      },
      incident: {
        title: 'Регистрация инцидента',
        titleField: 'Название инцидента',
        description: 'Описание',
        severity: 'Критичность',
        priority: 'Приоритет',
        category: 'Категория',
        notes: 'Заметки',
        notesPlaceholder: 'Добавьте заметки...',
        submit: 'Зарегистрировать',
      },
    },
    common: {
      cancel: 'Отмена',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
      close: 'Закрыть',
      back: 'Назад',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      selectDate: 'Выберите дату',
      selectTime: 'Выберите время',
    },
    severity: {
      critical: 'Критический',
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий',
    },
    fab: {
      createAlert: 'Создать алерт',
      registerIncident: 'Зарегистрировать инцидент',
    },
  },
};

type Translations = typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@alerthub_language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');

  React.useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored: string | null) => {
      if (stored === 'en' || stored === 'ru') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, []);

  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
