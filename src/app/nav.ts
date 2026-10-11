import {
  BarChart3, BookOpen, Brain, Building2, CalendarCheck, ClipboardList, Code2, Database, FileText, Gauge, Layers,
  LayoutDashboard, ListChecks, MessagesSquare, Network, NotebookPen, Repeat, Server, Settings, Terminal, Timer, TriangleAlert, Wrench, Cpu, Coffee,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem { to: string; label: string; icon: LucideIcon; color?: string }
export interface NavGroup { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { title: 'Home', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan', label: "Today's plan", icon: CalendarCheck },
  ] },
  { title: 'Learn', items: [
    { to: '/learn/dsa', label: 'DSA', icon: Brain, color: '--subject-dsa' },
    { to: '/learn/sql', label: 'SQL', icon: Database, color: '--subject-sql' },
    { to: '/learn/dbms', label: 'DBMS', icon: Layers, color: '--subject-sql' },
    { to: '/learn/oop-cpp', label: 'OOP in C++', icon: Code2, color: '--subject-oop-cpp' },
    { to: '/learn/oop-java', label: 'OOP in Java', icon: Coffee, color: '--subject-oop-java' },
    { to: '/learn/cn', label: 'Networks', icon: Network, color: '--subject-cn' },
    { to: '/learn/os', label: 'Operating Systems', icon: Cpu, color: '--subject-os' },
    { to: '/learn/system-design', label: 'System Design', icon: Server, color: '--subject-sd' },
    { to: '/learn/devops', label: 'DevOps & Cloud', icon: Terminal, color: '--subject-devops' },
    { to: '/learn/core-cs', label: 'Core CS', icon: BookOpen, color: '--subject-core' },
  ] },
  { title: 'Practice', items: [
    { to: '/problems', label: 'Problem bank', icon: ListChecks },
    { to: '/practice/mcq', label: 'MCQ practice', icon: ClipboardList },
    { to: '/sql/lab', label: 'SQL lab', icon: Database },
    { to: '/oa', label: 'OA centre', icon: Timer },
    { to: '/mock', label: 'Mock interviews', icon: MessagesSquare },
    { to: '/tools', label: 'Tools', icon: Wrench },
  ] },
  { title: 'Retain', items: [
    { to: '/revision', label: 'Revision', icon: Repeat },
    { to: '/mistakes', label: 'Mistake journal', icon: TriangleAlert },
    { to: '/notes', label: 'Notes & bookmarks', icon: NotebookPen },
  ] },
  { title: 'Track', items: [
    { to: '/analytics', label: 'Readiness', icon: Gauge },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
  ] },
  { title: 'Account', items: [
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/about', label: 'About and limits', icon: FileText },
  ] },
];
