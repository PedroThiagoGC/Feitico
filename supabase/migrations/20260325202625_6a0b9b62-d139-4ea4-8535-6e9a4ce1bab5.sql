
-- RLS policies for subscription_plans (read for all authenticated, write for authenticated)
CREATE POLICY "Allow read subscription_plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert subscription_plans" ON public.subscription_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update subscription_plans" ON public.subscription_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete subscription_plans" ON public.subscription_plans FOR DELETE TO authenticated USING (true);

-- Also allow anon read for subscription_plans (public pricing)
CREATE POLICY "Allow anon read subscription_plans" ON public.subscription_plans FOR SELECT TO anon USING (true);

-- RLS policies for platform_users
CREATE POLICY "Allow read platform_users" ON public.platform_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert platform_users" ON public.platform_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update platform_users" ON public.platform_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete platform_users" ON public.platform_users FOR DELETE TO authenticated USING (true);

-- RLS policies for tenant_subscriptions
CREATE POLICY "Allow read tenant_subscriptions" ON public.tenant_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert tenant_subscriptions" ON public.tenant_subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update tenant_subscriptions" ON public.tenant_subscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS policies for audit_logs
CREATE POLICY "Allow read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- RLS for tenants
CREATE POLICY "Allow read tenants" ON public.tenants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert tenants" ON public.tenants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update tenants" ON public.tenants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS for tenant_details
CREATE POLICY "Allow read tenant_details" ON public.tenant_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert tenant_details" ON public.tenant_details FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update tenant_details" ON public.tenant_details FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS for tenant_branding
CREATE POLICY "Allow read tenant_branding" ON public.tenant_branding FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert tenant_branding" ON public.tenant_branding FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update tenant_branding" ON public.tenant_branding FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS for tenant_settings
CREATE POLICY "Allow read tenant_settings" ON public.tenant_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert tenant_settings" ON public.tenant_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update tenant_settings" ON public.tenant_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
