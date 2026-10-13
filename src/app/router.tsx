import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '@/features/dashboard/Dashboard';

const PlanPage = lazy(() => import('@/features/plan/PlanPage'));
const LearnIndex = lazy(() => import('@/features/learn/LearnIndex'));
const ModulePage = lazy(() => import('@/features/learn/ModulePage'));
const TopicPage = lazy(() => import('@/features/learn/TopicPage'));
const ProblemsPage = lazy(() => import('@/features/problems/ProblemsPage'));
const CoachPage = lazy(() => import('@/features/coach/CoachPage'));
const McqPracticePage = lazy(() => import('@/features/mcq/McqPracticePage'));
const PatternDrillsPage = lazy(() => import('@/features/mcq/PatternDrillsPage'));
const SqlLabPage = lazy(() => import('@/features/sql/SqlLabPage'));
const SqlExercisePage = lazy(() => import('@/features/sql/SqlExercisePage'));
const OaCentre = lazy(() => import('@/features/oa/OaCentre'));
const OaRunner = lazy(() => import('@/features/oa/OaRunner'));
const OaResults = lazy(() => import('@/features/oa/OaResults'));
const RevisionPage = lazy(() => import('@/features/revision/RevisionPage'));
const MistakesPage = lazy(() => import('@/features/mistakes/MistakesPage'));
const NotesPage = lazy(() => import('@/features/notes/NotesPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
const ProgressPage = lazy(() => import('@/features/analytics/ProgressPage'));
const CompaniesPage = lazy(() => import('@/features/companies/CompaniesPage'));
const CompanyPage = lazy(() => import('@/features/companies/CompanyPage'));
const MockPage = lazy(() => import('@/features/mock/MockPage'));
const ToolsPage = lazy(() => import('@/features/tools/ToolsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const AboutPage = lazy(() => import('@/features/settings/AboutPage'));
const NotFound = lazy(() => import('@/features/NotFound'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'learn', element: <LearnIndex /> },
      { path: 'learn/:moduleId', element: <ModulePage /> },
      { path: 'learn/:moduleId/:topicId', element: <TopicPage /> },
      { path: 'problems', element: <ProblemsPage /> },
      { path: 'problems/:slug', element: <CoachPage /> },
      { path: 'practice/mcq', element: <McqPracticePage /> },
      { path: 'practice/patterns', element: <PatternDrillsPage /> },
      { path: 'sql/lab', element: <SqlLabPage /> },
      { path: 'sql/exercises/:id', element: <SqlExercisePage /> },
      { path: 'oa', element: <OaCentre /> },
      { path: 'oa/run/:id', element: <OaRunner /> },
      { path: 'oa/results/:id', element: <OaResults /> },
      { path: 'revision', element: <RevisionPage /> },
      { path: 'mistakes', element: <MistakesPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'companies', element: <CompaniesPage /> },
      { path: 'companies/:companyId', element: <CompanyPage /> },
      { path: 'mock', element: <MockPage /> },
      { path: 'tools', element: <ToolsPage /> },
      { path: 'tools/:toolId', element: <ToolsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
