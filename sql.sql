-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.account_analytics (
  id integer NOT NULL DEFAULT nextval('account_analytics_id_seq'::regclass),
  social_account_id integer,
  date date NOT NULL,
  platform character varying NOT NULL,
  followers integer DEFAULT 0,
  following integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  total_reach integer DEFAULT 0,
  total_impressions integer DEFAULT 0,
  avg_engagement_rate numeric,
  CONSTRAINT account_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT account_analytics_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id)
);
CREATE TABLE public.audit_log (
  id integer NOT NULL DEFAULT nextval('audit_log_id_seq'::regclass),
  user_id integer,
  action character varying NOT NULL,
  entity_type character varying,
  entity_id integer,
  old_value jsonb,
  new_value jsonb,
  ip_address character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.campaigns (
  id integer NOT NULL DEFAULT nextval('campaigns_id_seq'::regclass),
  client_id integer,
  name character varying NOT NULL,
  service_id integer,
  status character varying DEFAULT 'active'::character varying,
  budget numeric,
  start_date date,
  end_date date,
  target_leads integer,
  leads_generated integer DEFAULT 0,
  created_by integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT campaigns_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.clients (
  id integer NOT NULL DEFAULT nextval('clients_id_seq'::regclass),
  company_name character varying NOT NULL,
  contact_name character varying,
  email character varying,
  phone character varying,
  city character varying,
  industry character varying,
  assigned_user_id integer,
  status character varying DEFAULT 'active'::character varying,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.leads (
  id integer NOT NULL DEFAULT nextval('leads_id_seq'::regclass),
  client_id integer,
  campaign_id integer,
  full_name character varying,
  email character varying,
  phone character varying,
  source character varying,
  status character varying DEFAULT 'new'::character varying,
  notes text,
  assigned_to integer,
  created_at timestamp without time zone DEFAULT now(),
  last_contact timestamp without time zone,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id integer NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
  social_account_id integer,
  platform character varying NOT NULL,
  external_msg_id character varying,
  sender_name character varying,
  sender_id character varying,
  body text,
  is_read boolean DEFAULT false,
  assigned_to integer,
  replied_at timestamp without time zone,
  received_at timestamp without time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id),
  CONSTRAINT messages_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);
CREATE TABLE public.n8n_tracker (
  id integer NOT NULL,
  status text,
  current_step integer,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT n8n_tracker_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer,
  type USER-DEFINED NOT NULL,
  channel USER-DEFINED DEFAULT 'internal'::notif_channel,
  title character varying,
  body text,
  is_read boolean DEFAULT false,
  related_id integer,
  related_type character varying,
  sent_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.post_analytics (
  id integer NOT NULL DEFAULT nextval('post_analytics_id_seq'::regclass),
  post_id integer,
  platform character varying NOT NULL,
  fetched_at timestamp without time zone DEFAULT now(),
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  clicks integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  followers_gained integer DEFAULT 0,
  engagement_rate numeric,
  CONSTRAINT post_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT post_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.posts (
  id integer NOT NULL DEFAULT nextval('posts_id_seq'::regclass),
  draft_id character varying NOT NULL UNIQUE,
  service_id integer,
  service_name character varying,
  campaign_id integer,
  linkedin_draft text,
  instagram_draft text,
  image_prompt_linkedin text,
  image_prompt_instagram text,
  li_base_url text,
  ig_base_url text,
  linkedin_image_url text,
  instagram_image_url text,
  instagram_story_url text,
  logo_url text,
  cloudinary_public_id_li text,
  cloudinary_public_id_ig text,
  status USER-DEFINED DEFAULT 'Pending'::post_status,
  approved_by integer,
  approved_at timestamp without time zone,
  refused_reason text,
  linkedin_post_id text,
  instagram_post_id text,
  facebook_post_id text,
  instagram_story_id text,
  created_at timestamp without time zone DEFAULT now(),
  published_at timestamp without time zone,
  scheduled_at timestamp without time zone,
  sheet_row_number integer,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT posts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT posts_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.services (
  id integer NOT NULL DEFAULT nextval('services_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  hashtags text,
  color_hex character varying,
  accent_hex character varying,
  badge_label character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.social_accounts (
  id integer NOT NULL DEFAULT nextval('social_accounts_id_seq'::regclass),
  client_id integer,
  platform character varying NOT NULL,
  account_id character varying,
  account_name character varying,
  access_token text,
  token_expires timestamp without time zone,
  is_active boolean DEFAULT true,
  last_error text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT social_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT social_accounts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.tasks (
  id integer NOT NULL DEFAULT nextval('tasks_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  status USER-DEFINED DEFAULT 'todo'::task_status,
  priority USER-DEFINED DEFAULT 'medium'::task_priority,
  assigned_to integer,
  created_by integer,
  post_id integer,
  campaign_id integer,
  deadline date,
  completed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT tasks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT tasks_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'community_manager'::user_role,
  avatar_url text,
  telegram_id character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  last_login timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.workflow_executions (
  id integer NOT NULL DEFAULT nextval('workflow_executions_id_seq'::regclass),
  workflow_name character varying NOT NULL,
  post_id integer,
  draft_id character varying,
  step character varying,
  status character varying,
  triggered_at timestamp without time zone DEFAULT now(),
  completed_at timestamp without time zone,
  duration_ms integer,
  error_message text,
  payload jsonb,
  CONSTRAINT workflow_executions_pkey PRIMARY KEY (id),
  CONSTRAINT workflow_executions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);