import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Salon } from "./salon.entity";

@Entity("professionals")
export class Professional {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "salon_id", type: "uuid" })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: "CASCADE" })
  @JoinColumn({ name: "salon_id" })
  salon: Salon;

  @Column({ type: "text" })
  name: string;

  @Column({ name: "photo_url", type: "text", nullable: true })
  photoUrl: string | null;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({ name: "commission_type", type: "text", default: "percentage" })
  commissionType: string;

  @Column({ name: "commission_value", type: "numeric", default: 0 })
  commissionValue: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
