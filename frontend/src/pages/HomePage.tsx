import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { publicApi } from '../lib/api';
import { ErrorState, LoadingState } from './PagePrimitives';
import { filterMenuItems, formatMoney } from './pageUtils';

export function HomePage() {
  const { t } = useTranslation();
  const menuQuery = useQuery({ queryKey: ['public-menu'], queryFn: publicApi.menu });
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const filteredItems = filterMenuItems(menuQuery.data, deferredSearch);

  const featuredItems = useMemo(() => filteredItems.slice(0, 3), [filteredItems]);

  return (
    <div className="-mx-4 -mt-6 bg-[#fbf9f5] text-[#1b1c1a] sm:-mx-6 lg:-mx-8">
      <section className="border-b border-[#d3c3c0]/40 bg-[#fbf9f5]/95 px-6 py-4 md:px-12">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <span className="font-['Noto_Serif'] text-xl font-bold uppercase tracking-tight text-[#271310] md:text-2xl">
            {t('THE CULINARY CURATOR')}
          </span>
          <div className="hidden items-center gap-7 lg:flex">
            <a className="text-xs uppercase tracking-[0.22em] text-[#504442] transition-colors hover:text-[#271310]" href="#story">{t('Our Story')}</a>
            <a className="text-xs uppercase tracking-[0.22em] text-[#504442] transition-colors hover:text-[#271310]" href="#menu">{t('Menu')}</a>
            <a className="text-xs uppercase tracking-[0.22em] text-[#504442] transition-colors hover:text-[#271310]" href="#promotions">{t('Promotions')}</a>
            <a className="text-xs uppercase tracking-[0.22em] text-[#504442] transition-colors hover:text-[#271310]" href="#digital">{t('Digital Dining')}</a>
            <a className="text-xs uppercase tracking-[0.22em] text-[#504442] transition-colors hover:text-[#271310]" href="#contact">{t('Contact')}</a>
          </div>
          <Link className="rounded-sm bg-[#271310] px-6 py-2.5 text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90" to="/book">
            {t('Book a Table')}
          </Link>
        </div>
      </section>

      <section className="relative isolate flex min-h-[74vh] items-center justify-center overflow-hidden px-6 py-16 md:px-12">
        <img
          alt={t('Luxury Restaurant Interior')}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1920&q=80"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#271310]/35 to-[#271310]/85" />
        <div className="mx-auto w-full max-w-4xl text-center">
          <h1 className="font-['Noto_Serif'] text-4xl italic leading-tight text-[#fbf9f5] md:text-6xl lg:text-7xl">
            {t('Experience the Art of Fine Dining')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-8 text-[#e4e2de] md:text-xl">
            {t('A curated symphony of flavors, textures, and aromas meticulously crafted for the discerning palate.')}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link className="rounded-sm bg-[#735c00] px-10 py-4 text-sm uppercase tracking-[0.18em] text-white transition hover:brightness-105" to="/book">
              {t('Book a Table')}
            </Link>
            <a className="rounded-sm border border-[#e4e2de]/50 px-10 py-4 text-sm uppercase tracking-[0.18em] text-[#fbf9f5] backdrop-blur transition hover:bg-white/10" href="#menu">
              {t('View Menu Online')}
            </a>
          </div>
        </div>
      </section>

      <section id="story" className="px-6 py-24 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:items-center">
          <div className="space-y-7 lg:col-span-6">
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-[#735c00]">{t('The Heritage')}</p>
              <h2 className="mt-4 font-['Noto_Serif'] text-4xl leading-tight text-[#271310] md:text-5xl">
                {t('Gastronomic Legacies Since 1994')}
              </h2>
            </div>
            <div className="space-y-5 text-lg font-light leading-8 text-[#504442]">
              <p>{t('Founded by Executive Chef Julian Thorne, The Culinary Curator began as a small atelier in the heart of the historic district.')}</p>
              <p>{t('Our philosophy is rooted in deep respect for seasonal ingredients and a service rhythm designed for memorable dining moments.')}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 border-y border-[#d3c3c0]/50 py-5">
              <div>
                <p className="font-['Noto_Serif'] text-2xl text-[#271310]">{String(menuQuery.data?.categories.length ?? 0)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#504442]">{t('Active categories')}</p>
              </div>
              <div>
                <p className="font-['Noto_Serif'] text-2xl text-[#271310]">{String(menuQuery.data?.items.length ?? 0)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#504442]">{t('Live dishes')}</p>
              </div>
            </div>
          </div>
          <div className="grid h-[520px] grid-cols-2 gap-4 lg:col-span-6">
            <img
              alt={t('Chef plating')}
              className="h-full w-full rounded-sm object-cover"
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"
            />
            <div className="grid grid-rows-2 gap-4">
              <img
                alt={t('Atmosphere')}
                className="h-full w-full rounded-sm object-cover"
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
              />
              <img
                alt={t('Ingredients')}
                className="h-full w-full rounded-sm object-cover"
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="border-y border-[#d3c3c0]/40 bg-[#f5f3ef] px-6 py-24 md:px-12">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs uppercase tracking-[0.36em] text-[#735c00]">{t('The Selection')}</p>
          <h2 className="mt-4 font-['Noto_Serif'] text-4xl italic text-[#271310] md:text-5xl">
            {t('Savor our curated menus from anywhere')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light italic text-[#504442]">
            {t('Explore our rotating seasonal collections, from tasting experiences to refined a la carte selections.')}
          </p>

          <div className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
            <a className="rounded-sm bg-[#271310] px-10 py-4 text-sm uppercase tracking-[0.18em] text-white transition hover:opacity-95" href="#menu-grid">
              {t('View Seasonal Menu')}
            </a>
            <Link className="rounded-sm border border-[#271310] px-10 py-4 text-sm uppercase tracking-[0.18em] text-[#271310] transition hover:bg-[#271310] hover:text-white" to="/staff/login">
              {t('Staff Console')}
            </Link>
          </div>

          <div className="mx-auto mt-10 max-w-lg text-left">
            <label className="block text-xs uppercase tracking-[0.22em] text-[#504442]" htmlFor="menu-search">{t('Search')}</label>
            <input
              id="menu-search"
              className="mt-2 w-full rounded-sm border border-[#d3c3c0] bg-white px-4 py-3 text-sm text-[#1b1c1a] placeholder:text-[#827472]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search for dishes or categories')}
              value={search}
            />
          </div>

          {menuQuery.isLoading ? <div className="mt-8"><LoadingState label={t('Loading menu')} /></div> : null}
          {menuQuery.error ? <div className="mt-8"><ErrorState error={menuQuery.error} /></div> : null}

          {menuQuery.data ? (
            <div id="menu-grid" className="mt-14">
              <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.18em] text-[#504442]">
                {menuQuery.data.categories.map((category) => (
                  <span key={category.id} className="rounded-full border border-[#d3c3c0] bg-white px-4 py-2">
                    {category.name}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {featuredItems.map((item) => (
                  <article key={item.id} className="group cursor-pointer">
                    <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-sm bg-[#e4e2de]">
                      <img
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={item.images.find((image) => image.primary)?.imageUrl ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'}
                      />
                    </div>
                    <h3 className="font-['Noto_Serif'] text-2xl italic text-[#271310]">{item.name}</h3>
                    <p className="mt-2 text-sm font-light text-[#504442]">{item.description || t('Built for quick service, QR browsing, and direct cashier handoff.')}</p>
                    <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#735c00]">{formatMoney(item.price)}</p>
                  </article>
                ))}
              </div>

              {!featuredItems.length ? (
                <div className="mt-8 rounded-sm border border-dashed border-[#d3c3c0] bg-white/70 p-6 text-sm text-[#504442]">
                  {t('No dishes match this search yet.')}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section id="promotions" className="bg-[#fbf9f5] px-6 py-24 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div className="rounded-sm bg-[#271310] p-10 text-white md:p-14">
            <p className="text-xs uppercase tracking-[0.36em] text-[#e9c349]">{t('Exclusive Engagement')}</p>
            <h2 className="mt-6 font-['Noto_Serif'] text-4xl italic leading-tight">{t('The Winter Tasting Odyssey')}</h2>
            <p className="mt-6 text-lg font-light leading-8 text-white/80">
              {t('A 9-course journey through seasonal produce and coastal treasures curated by the house chef.')}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link className="rounded-sm bg-[#735c00] px-8 py-3 text-sm uppercase tracking-[0.18em] text-white" to="/book">
                {t('Reserve Experience')}
              </Link>
              <p className="font-['Noto_Serif'] text-2xl italic">{t('$225 / guest')}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="border-l-4 border-[#735c00] bg-[#efeeea] p-8">
              <h3 className="font-['Noto_Serif'] text-2xl text-[#271310]">{t("Chef's Table Evenings")}</h3>
              <p className="mt-3 text-[#504442]">{t('An intimate kitchen-facing evening, limited seating, and bespoke pairing notes.')}</p>
            </div>
            <div className="border-l-4 border-[#271310] bg-[#efeeea] p-8">
              <h3 className="font-['Noto_Serif'] text-2xl text-[#271310]">{t('Vintage Sunday Cellar')}</h3>
              <p className="mt-3 text-[#504442]">{t('Special access to reserve bottles, opened by the glass on select Sundays.')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="digital" className="bg-[#271310] px-6 py-24 text-center text-white md:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-['Noto_Serif'] text-4xl italic md:text-5xl">{t('Seamless Digital Dining')}</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-light leading-8 text-white/75">
            {t('Scan the table QR to browse menu photos, place orders, and send service requests without waiting for paper menus.')}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a className="rounded-sm bg-[#735c00] px-10 py-4 text-sm uppercase tracking-[0.18em] text-white" href="/qr/sample-token">
              {t('Access Mobile Portal')}
            </a>
            <Link className="rounded-sm border border-white/30 px-10 py-4 text-sm uppercase tracking-[0.18em] text-white transition hover:bg-white/10" to="/staff">
              {t('Online Ordering Console')}
            </Link>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-white/60">{t('Available for in-restaurant and carry-out service')}</p>
        </div>
      </section>

      <section id="contact" className="px-6 py-24 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
          <div className="space-y-9">
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-[#735c00]">{t('Reservations')}</p>
              <h2 className="mt-5 font-['Noto_Serif'] text-4xl italic text-[#271310] md:text-5xl">{t('Secure Your Experience')}</h2>
            </div>
            <div className="space-y-6 text-lg font-light text-[#504442]">
              <p>{t('742 Gastronomy Avenue, Culinary District, NY 10012')}</p>
              <p>{t('+1 (212) 555-0198')}</p>
              <p>{t('Tue - Thu: 18:00 - 23:00 | Fri - Sun: 17:00 - 00:00')}</p>
            </div>
            <Link className="inline-block rounded-sm bg-[#271310] px-10 py-4 text-sm uppercase tracking-[0.2em] text-white" to="/book">
              {t('Instant Online Booking')}
            </Link>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-sm shadow-2xl">
            <img
              alt={t('Map placeholder')}
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
            />
            <div className="absolute inset-0 bg-[#271310]/30" />
            <div className="absolute bottom-8 left-8 right-8 bg-[#fbf9f5]/95 p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#735c00]">{t('Our Location')}</p>
              <p className="mt-2 font-['Noto_Serif'] text-xl italic text-[#271310]">{t('742 Gastronomy Avenue')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
