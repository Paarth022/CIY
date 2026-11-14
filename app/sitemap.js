const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://craftityourself.gg';

export default function sitemap() {
  const now = new Date();
  const pages = [
    { url: '',         priority: 1.0, changeFrequency: 'weekly'  },
    { url: '/create',  priority: 0.9, changeFrequency: 'weekly'  },
    { url: '/explore', priority: 0.9, changeFrequency: 'daily'   },
    { url: '/debug',   priority: 0.8, changeFrequency: 'weekly'  },
    { url: '/update',  priority: 0.8, changeFrequency: 'weekly'  },
    { url: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
    { url: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { url: '/login',   priority: 0.4, changeFrequency: 'yearly'  },
    { url: '/signup',  priority: 0.6, changeFrequency: 'yearly'  },
    { url: '/terms',   priority: 0.3, changeFrequency: 'yearly'  },
    { url: '/privacy', priority: 0.3, changeFrequency: 'yearly'  },
    { url: '/refund',  priority: 0.3, changeFrequency: 'yearly'  },
    { url: '/cookies', priority: 0.2, changeFrequency: 'yearly'  },
  ];
  return pages.map(p => ({
    url: `${BASE}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
