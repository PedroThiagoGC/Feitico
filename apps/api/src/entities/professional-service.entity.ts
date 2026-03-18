import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Professional } from "./professional.entity";
import { Service } from "./service.entity";

@Entity("professional_services")
@Unique(["professionalId", "serviceId"])
export class ProfessionalService {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "professional_id", type: "uuid" })
  professionalId: string;

  @ManyToOne(() => Professional, { onDelete: "CASCADE" })
  @JoinColumn({ name: "professional_id" })
  professional: Professional;

  @Column({ name: "service_id", type: "uuid" })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: "CASCADE" })
  @JoinColumn({ name: "service_id" })
  service: Service;

  @Column({ name: "custom_price", type: "numeric", nullable: true })
  customPrice: number | null;

  @Column({ name: "custom_duration_minutes", type: "integer", nullable: true })
  customDurationMinutes: number | null;

  @Column({ name: "custom_buffer_minutes", type: "integer", nullable: true })
  customBufferMinutes: number | null;

  @Column({ name: "commission_override_type", type: "text", nullable: true })
  commissionOverrideType: string | null;

  @Column({
    name: "commission_override_value",
    type: "numeric",
    nullable: true,
  })
  commissionOverrideValue: number | null;

  @Column({ type: "boolean", default: true })
  active: boolean;
}
